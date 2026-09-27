import { expect, test } from "bun:test";
import type { RunRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import { commentOnRunFindings, FakePrComments } from "../src/index.ts";

const repo = "demo/orbit-app";
const sha = "a".repeat(40);

function fixture() {
  const store = new MemoryStore();
  store.putRepo({
    repo,
    visibility: "public",
    connected: true,
    tokenHash: "registered",
    label: "Drifting",
    driftDegrees: 20,
    latestRunId: "run",
  });
  store.putSource({
    id: "readme",
    repo,
    kind: "readme",
    title: "README.md",
    url: `https://github.com/${repo}/blob/${sha}/README.md`,
    claimCount: 2,
  });
  const run: RunRecord = {
    id: "run",
    repo,
    commitSha: sha,
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "failure",
    evidence: [],
    results: [
      {
        kind: "port_listens",
        params: { port: 3000, startScript: "dev" },
        claimId: "c_1111111111",
        sourceId: "readme",
        quote: "Port 3000 | default",
        state: "confirmed",
        status: "fail",
        expected: "port 3000",
        actual: "listening on 8080",
        deepLink: `https://github.com/${repo}/blob/${sha}/README.md#L24`,
      },
      {
        kind: "port_listens",
        params: { port: 3000, startScript: "dev" },
        claimId: "c_2222222222",
        sourceId: "readme",
        quote: "Untrusted check",
        state: "disputed",
        status: "fail",
        expected: "port 3000",
        actual: "unknown",
        deepLink: "https://attacker.invalid/phish",
      },
    ],
  };
  return { store, run };
}

test("one evidence comment separates confirmed drift and disputed review items", async () => {
  const { store, run } = fixture();
  const github = new FakePrComments();
  github.heads.set(`${repo}\n42`, sha);
  const first = await commentOnRunFindings(
    store,
    run,
    42,
    "https://ground.example",
    github,
  );
  expect(first).toEqual({ ok: true, value: "created" });
  const body = github.comments.get(`${repo}\n42`);
  expect(body).toContain("README.md");
  expect(body).toContain("Port 3000 \\| default");
  expect(body).toContain("Untrusted check");
  expect(body).toContain("needs review");
  expect(body).toContain("runs/run");
  expect(body).toContain("README.md#L24");
  expect(
    await commentOnRunFindings(
      store,
      run,
      42,
      "https://ground.example",
      github,
    ),
  ).toEqual({ ok: true, value: "unchanged" });
  const changed: RunRecord = {
    ...run,
    results: run.results.map((item, index) =>
      index === 0 ? { ...item, actual: "listening on 9090" } : item,
    ),
  };
  expect(
    await commentOnRunFindings(
      store,
      changed,
      42,
      "https://ground.example",
      github,
    ),
  ).toEqual({ ok: true, value: "updated" });
  expect(github.comments.size).toBe(1);
  expect(github.actions).toEqual(["created", "unchanged", "updated"]);
});

test("disputed failures create a review comment while disconnected repos do not", async () => {
  const { store, run } = fixture();
  const github = new FakePrComments();
  github.heads.set(`${repo}\n42`, sha);
  const disputed: RunRecord = {
    ...run,
    results: run.results.map((item) => ({
      ...item,
      state: "disputed" as const,
    })),
  };
  expect(
    await commentOnRunFindings(
      store,
      disputed,
      42,
      "https://ground.example",
      github,
    ),
  ).toEqual({ ok: true, value: "created" });
  expect(github.comments.get(`${repo}\n42`)).toContain("needs review");
  const record = store.getRepo(repo);
  if (!record) throw new Error("Missing repo");
  store.putRepo({ ...record, connected: false });
  expect(
    await commentOnRunFindings(
      store,
      run,
      42,
      "https://ground.example",
      github,
    ),
  ).toEqual({ ok: true, value: "skipped" });
  expect(github.comments.size).toBe(1);
});

test("PR evidence refuses a number whose head differs from the run", async () => {
  const { store, run } = fixture();
  const github = new FakePrComments();
  github.heads.set(`${repo}\n42`, "b".repeat(40));
  expect(
    await commentOnRunFindings(
      store,
      run,
      42,
      "https://ground.example",
      github,
    ),
  ).toEqual({ ok: false, error: { code: "invalid_input" } });
  expect(github.comments.size).toBe(0);
});
