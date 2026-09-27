import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ConfluenceCorrection,
  MemoryMessagingStore,
  MessagingCipher,
  MessagingHub,
  RecordingIMessage,
} from "@ground-control/messaging";
import { claimId, flightPlanSchema } from "@ground-control/plan";
import { FixtureConfluence } from "@ground-control/sources";
import type { RunClaim, RunRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import {
  CompositeCorrection,
  FakeGitHubFixes,
  RepoCorrection,
} from "../src/index.ts";

const repo = "demo/orbit-app";
const sha = "a".repeat(40);
const orbit = join(process.cwd(), "demo/orbit-app");
const plan = flightPlanSchema.parse(
  JSON.parse(readFileSync(join(orbit, "flightchecks/flightplan.json"), "utf8")),
);
const portClaim = plan.claims.find((claim) => claim.kind === "port_listens");
if (portClaim?.kind !== "port_listens")
  throw new Error("Orbit fixture has no port check");
const portParams = portClaim.params;
const portQuote = portClaim.occurrences[0]?.quote;
if (!portQuote) throw new Error("Orbit port check has no quote");
const urlClaim = plan.claims.find(
  (claim) =>
    claim.kind === "port_listens" &&
    claim.occurrences[0]?.location.kind === "file" &&
    claim.occurrences[0]?.location.lineStart === 30,
);
const urlQuote = urlClaim?.occurrences[0]?.quote;
if (!urlQuote) throw new Error("Orbit URL port check has no quote");

function failure(
  sourceId: string,
  quote: string,
  deepLink: string | null,
): RunClaim {
  const params = portParams;
  return {
    kind: "port_listens",
    params,
    claimId: claimId(sourceId, quote, "port_listens", params),
    sourceId,
    quote,
    state: "confirmed",
    status: "fail",
    expected: "Port 3000 should listen",
    actual: "No healthy response on port 3000; listening on 8080",
    deepLink,
  };
}

test("one grouped drift opens a cited draft, suggests wiki wording, and comments on Confluence", async () => {
  const store = new MemoryStore();
  store.putRepo({
    repo,
    visibility: "public",
    connected: true,
    tokenHash: "registered",
    label: "Drifting",
    driftDegrees: 30,
    latestRunId: "drift-run",
  });
  for (const [id, kind, title, url] of [
    [
      "readme",
      "readme",
      "README.md",
      `https://github.com/${repo}/blob/${sha}/README.md`,
    ],
    [
      "wiki",
      "wiki",
      "Getting Started",
      `https://github.com/${repo}/wiki/Getting-Started`,
    ],
    [
      "confluence",
      "confluence",
      "Orbit onboarding",
      "https://team.atlassian.net/wiki/spaces/GC/pages/123/Orbit",
    ],
  ] as const)
    store.putSource({ id, repo, kind, title, url, claimCount: 1 });
  const drift: RunRecord = {
    id: "drift-run",
    repo,
    commitSha: sha,
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "failure",
    evidence: [],
    results: [
      failure(
        "readme",
        portQuote,
        `https://github.com/${repo}/blob/${sha}/README.md#L24-L24`,
      ),
      failure(
        "readme",
        urlQuote,
        `https://github.com/${repo}/blob/${sha}/README.md#L30-L30`,
      ),
      failure("wiki", "The server listens on port 3000 by default.", null),
      failure(
        "confluence",
        "The server listens on port 3000 by default.",
        null,
      ),
    ],
  };
  store.putRun(drift);
  const github = new FakeGitHubFixes();
  github.putFile(
    repo,
    sha,
    "README.md",
    readFileSync(join(orbit, "README.md"), "utf8"),
  );
  github.putFile(
    repo,
    sha,
    "flightchecks/flightplan.json",
    JSON.stringify(plan),
  );
  github.putFile(
    repo,
    sha,
    "src/server.js",
    readFileSync(join(orbit, "src/server.js"), "utf8").replace(
      'process.env.PORT ?? "3000"',
      'process.env.PORT ?? "8080"',
    ),
  );
  const confluence = new FixtureConfluence(
    new Map([
      ["123", { id: "123", version: 1, storageHtml: "<p>Old port</p>" }],
    ]),
  );
  const correction = new CompositeCorrection(
    new RepoCorrection(github),
    new ConfluenceCorrection(confluence, "https://ground.example"),
  );
  const cipher = new MessagingCipher("fixture-secret");
  const messages = new MemoryMessagingStore();
  const imessage = new RecordingIMessage();
  const hub = new MessagingHub({
    appStore: store,
    messages,
    cipher,
    imessage,
    correction,
    publicUrl: "https://ground.example",
    now: () => new Date("2026-09-26T12:01:00Z"),
    trust: {
      async set() {
        return { ok: true, value: { failing: false } };
      },
    },
  });
  expect((await hub.requestLink("navi", "+15551234567")).ok).toBe(true);
  const token = /LINK ([A-Za-z0-9_-]{32})/.exec(
    imessage.sent[0]?.text ?? "",
  )?.[1];
  if (!token) throw new Error("iMessage link challenge was not sent");
  expect(
    await hub.handleInbound({
      id: "link",
      senderId: "+15551234567",
      senderAddress: "+15551234567",
      chatId: "chat",
      linePhone: "+15550000000",
      text: `LINK ${token}`,
    }),
  ).toEqual({ ok: true, value: "handled" });
  expect((await hub.alert(drift, "navi", true)).ok).toBe(true);
  expect(imessage.sent).toHaveLength(1);
  expect(imessage.replies.at(-1)?.text).toContain("3 docs");
  expect(imessage.replies.at(-1)?.linePhone).toBe("+15550000000");
  expect(
    await hub.handleInbound({
      id: "fix",
      senderId: "+15551234567",
      senderAddress: "+15551234567",
      chatId: "chat",
      linePhone: "+15550000000",
      text: "FIX",
    }),
  ).toEqual({ ok: true, value: "handled" });
  expect(github.drafts).toHaveLength(1);
  expect(github.drafts[0]?.files.map((file) => file.path)).toEqual([
    "README.md",
    "flightchecks/flightplan.json",
    "flightchecks/flight.test.mjs",
  ]);
  const updated = github.drafts[0]?.files.find(
    (file) => file.path === "README.md",
  )?.content;
  const original = readFileSync(join(orbit, "README.md"), "utf8");
  expect(
    updated
      ?.split("\n")
      .flatMap((line, index) =>
        line !== original.split("\n")[index] ? [index + 1] : [],
      ),
  ).toEqual([24, 30]);
  expect(updated?.split("\n")[23]).toContain("port 8080");
  expect(updated?.split("\n")[29]).toContain("localhost:8080");
  expect(imessage.replies.at(-1)?.text).toContain("Draft pull request");
  expect(imessage.replies.at(-1)?.text).toContain("Suggested wiki change");
  expect(imessage.replies.at(-1)?.text).toContain("Confluence");
  expect(confluence.comments).toHaveLength(1);
  const pending = messages.findCorrection(
    repo,
    github.drafts[0]?.baseSha ?? "",
  );
  expect(pending).toBeNull();
  const alert = messages.listAlerts("navi")[0];
  expect(alert?.state).toBe("fixing");
  const correctionSha = alert?.correctionCommitSha;
  if (!correctionSha) throw new Error("FIX did not record correction commit");
  const newPlanFile = github.drafts[0]?.files.find(
    (file) => file.path === "flightchecks/flightplan.json",
  )?.content;
  if (!newPlanFile) throw new Error("FIX did not publish a plan");
  const newPlan = flightPlanSchema.parse(JSON.parse(newPlanFile));
  const passing: RunRecord = {
    ...drift,
    id: "correction-run",
    commitSha: correctionSha,
    verdict: "success",
    results: newPlan.claims.map((claim) => ({
      kind: claim.kind,
      params: claim.params,
      claimId: claim.id,
      sourceId: claim.sourceId,
      quote: claim.occurrences[0]?.quote ?? "",
      state: "confirmed" as const,
      status: "pass" as const,
      expected: "Expected",
      actual: "Observed",
      deepLink: null,
    })) as RunClaim[],
  };
  expect(await hub.confirmCorrection(passing)).toEqual({
    ok: true,
    value: false,
  });
  expect(messages.findCorrection(repo, correctionSha)?.state).toBe("fixing");
  github.statuses.set(correctionSha, "success");
  expect(await hub.confirmCorrection(passing)).toEqual({
    ok: true,
    value: true,
  });
  expect(messages.listAlerts("navi")[0]?.state).toBe("fixed");
  expect(imessage.replies.at(-1)?.text).toContain(
    "Correction passed all 17 checks",
  );
});
