import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AlertRecord } from "@ground-control/messaging";
import { claimId, flightPlanSchema } from "@ground-control/plan";
import type { AppStore, RunRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import {
  FakeGitHubFixes,
  proposeCorrection,
  RepoCorrection,
} from "../src/index.ts";

const repo = "demo/orbit-app";
const sha = "b".repeat(40);
const docs = "# Local run\nThe server listens on port 3000 by default.\n";
const man = readFileSync(
  join(process.cwd(), "demo/orbit-app/man/orbit.1"),
  "utf8",
);
const paths = [
  {
    sourceId: "docs",
    kind: "docs" as const,
    path: "docs/setup.md",
    text: docs,
    quote: "The server listens on port 3000 by default.",
  },
  {
    sourceId: "man",
    kind: "man" as const,
    path: "man/orbit.1",
    text: man,
    quote: "The development server listens on port 3000 by default.",
  },
];

function claim(entry: (typeof paths)[number]) {
  const startOffset = entry.text.indexOf(entry.quote);
  const line = entry.text.slice(0, startOffset).split("\n").length;
  const params = { port: 3000, startScript: "dev" };
  return {
    kind: "port_listens" as const,
    params,
    id: claimId(entry.sourceId, entry.quote, "port_listens", params),
    sourceId: entry.sourceId,
    occurrences: [
      {
        quote: entry.quote,
        location: {
          kind: "file" as const,
          sourceId: entry.sourceId,
          startOffset,
          endOffset: startOffset + entry.quote.length,
          path: entry.path,
          lineStart: line,
          lineEnd: line,
        },
      },
    ],
    tier: "runtime" as const,
  };
}

function fixture() {
  const claims = paths.map(claim);
  const plan = flightPlanSchema.parse({
    repo,
    sourceHashes: Object.fromEntries(
      paths.map((entry) => [
        entry.sourceId,
        createHash("sha256").update(entry.text).digest("hex"),
      ]),
    ),
    claims,
  });
  const results = claims.map((item) => ({
    kind: item.kind,
    params: item.params,
    claimId: item.id,
    sourceId: item.sourceId,
    quote: item.occurrences[0]?.quote ?? "",
    state: "confirmed" as const,
    status: "fail" as const,
    expected: "Port 3000 should listen",
    actual: "No healthy response on port 3000; listening on 8080",
    deepLink: `https://github.com/${repo}/blob/${sha}/${item.occurrences[0]?.location.path}#L${item.occurrences[0]?.location.lineStart}`,
  }));
  const run: RunRecord = {
    id: "run",
    repo,
    commitSha: sha,
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "failure",
    evidence: [],
    results,
  };
  const alert: AlertRecord = {
    id: "drift",
    githubLogin: "navi",
    repo,
    commitSha: sha,
    runId: run.id,
    claimIds: results.map((item) => item.claimId),
    sourceIds: results.map((item) => item.sourceId),
    state: "open",
    delivery: "sent",
    createdAt: run.createdAt,
  };
  const store = new MemoryStore();
  store.putRepo({
    repo,
    connected: true,
    visibility: "public",
    tokenHash: "registered",
    label: "Drifting",
    driftDegrees: 30,
    latestRunId: run.id,
  });
  for (const entry of paths)
    store.putSource({
      id: entry.sourceId,
      repo,
      kind: entry.kind,
      title: entry.path,
      url: `https://github.com/${repo}/blob/${sha}/${entry.path}`,
      claimCount: 1,
    });
  const github = new FakeGitHubFixes();
  github.putFile(
    repo,
    sha,
    "src/server.js",
    'const port = Number(process.env.PORT ?? "8080");',
  );
  github.putFile(
    repo,
    sha,
    "flightchecks/flightplan.json",
    JSON.stringify(plan),
  );
  for (const entry of paths) github.putFile(repo, sha, entry.path, entry.text);
  return { plan, run, alert, store, github };
}

test("docs and man corrections replace only the cited port and rebase both claims", async () => {
  const { alert, run, store, github } = fixture();
  const result = await proposeCorrection(github, alert, run, store);
  if (!result.ok) throw new Error(result.error.code);
  expect(result.value.files.map((file) => file.path)).toEqual([
    "docs/setup.md",
    "man/orbit.1",
  ]);
  for (const file of result.value.files) {
    expect(file.edits).toHaveLength(1);
    expect(file.before.slice(0, file.edits[0]?.startOffset)).toBe(
      file.after.slice(0, file.edits[0]?.startOffset),
    );
    expect(file.after).toContain("port 8080 by default");
  }
  expect(
    result.value.plan?.claims.every(
      (item) => item.kind === "port_listens" && item.params.port === 8080,
    ),
  ).toBe(true);
  expect(result.value.plan?.claims.map((item) => item.id)).not.toEqual(
    run.results.map((item) => item.claimId),
  );
});

test("FIX rejects uncited lines, stale plan content, and unconnected repositories", async () => {
  const first = fixture();
  const wrong: RunRecord = {
    ...first.run,
    results: first.run.results.map((item, index) =>
      index === 0
        ? { ...item, deepLink: `${item.deepLink?.split("#")[0]}#L3` }
        : item,
    ),
  };
  expect(
    await proposeCorrection(first.github, first.alert, wrong, first.store),
  ).toEqual({ ok: false, error: { code: "uncited_change" } });
  const second = fixture();
  second.github.putFile(
    repo,
    sha,
    "docs/setup.md",
    `${docs}Unrelated appendix.\n`,
  );
  expect(
    await proposeCorrection(
      second.github,
      second.alert,
      second.run,
      second.store,
    ),
  ).toEqual({ ok: false, error: { code: "stale_plan" } });
  const third = fixture();
  const record = third.store.getRepo(repo);
  if (!record) throw new Error("Missing fixture repo");
  third.store.putRepo({ ...record, connected: false });
  expect(
    await new RepoCorrection(third.github).fix(
      third.alert,
      third.run,
      third.store as AppStore,
    ),
  ).toEqual({ ok: false, error: { code: "unavailable" } });
  expect(third.github.drafts).toHaveLength(0);
});
