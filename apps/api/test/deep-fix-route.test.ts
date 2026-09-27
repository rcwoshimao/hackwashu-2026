import { expect, test } from "bun:test";
import type { RunRecord } from "@ground-control/store";
import { login, setup } from "./fixture.ts";

test("deep fix route accepts only a current confirmed CI failure from an admin", async () => {
  const calls: string[] = [];
  const { app, store, github } = setup(undefined, {
    deepFix: {
      async fix(run, ids) {
        calls.push(`${run.id}:${ids.join(",")}`);
        return {
          ok: true,
          url: "https://github.com/owner/repo/pull/3",
          fixedClaimIds: ids,
        };
      },
    },
  });
  const run: RunRecord = {
    id: "ci-1",
    repo: "owner/repo",
    commitSha: "a".repeat(40),
    createdAt: "2026-09-27T00:00:00Z",
    verdict: "failure",
    origin: "ci",
    evidence: [],
    results: [
      {
        claimId: "c_one",
        sourceId: "readme",
        quote: "Wrong path",
        kind: "file_exists",
        params: { path: "wrong" },
        state: "confirmed",
        status: "fail",
        expected: "exists",
        actual: "missing",
        deepLink: null,
      },
    ],
  };
  store.putRepo({
    repo: run.repo,
    visibility: "private",
    connected: true,
    runtimeEnabled: true,
    tokenHash: null,
    label: "Drifting",
    driftDegrees: 90,
    latestRunId: run.id,
  });
  store.putRun(run);
  const path = "/api/runs/ci-1/claims/c_one/fix";
  expect((await app.request(path, { method: "POST" })).status).toBe(401);
  const cookie = await login(app);
  github.permission.canAdmin = false;
  expect(
    (await app.request(path, { method: "POST", headers: { cookie } })).status,
  ).toBe(403);
  github.permission.canAdmin = true;
  expect(
    (await app.request(path, { method: "POST", headers: { cookie } })).status,
  ).toBe(201);
  expect(calls).toEqual(["ci-1:c_one"]);
  const saved = store.getRepo(run.repo);
  if (!saved) throw new Error("missing fixture repository");
  store.putRepo({ ...saved, latestRunId: "newer" });
  store.putRun({ ...run, id: "newer", createdAt: "2026-09-27T01:00:00Z" });
  expect(
    (await app.request(path, { method: "POST", headers: { cookie } })).status,
  ).toBe(409);
  expect(calls).toHaveLength(1);
});
