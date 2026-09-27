import { expect, test } from "bun:test";
import type { RunClaim, RunRecord } from "@ground-control/store";
import { createApi } from "../src/index.ts";
import type { ScanFixService } from "../src/scan-fix.ts";
import { json, login, setup } from "./fixture.ts";

const repo = "maintainer/docs";
const sha = "c".repeat(40);

function claim(claimId: string, status: "pass" | "fail"): RunClaim {
  return {
    claimId,
    sourceId: "readme_1",
    kind: "file_exists",
    params: { path: `docs/${claimId}.md` },
    quote: `docs/${claimId}.md`,
    state: status === "pass" ? "confirmed" : "disputed",
    status,
    expected: "{}",
    actual: status,
    deepLink: null,
  };
}

function seed(store: ReturnType<typeof setup>["store"]): RunRecord {
  const results = [
    claim("c_1111111111", "fail"),
    claim("c_2222222222", "pass"),
    claim("c_3333333333", "pass"),
  ];
  const run: RunRecord = {
    id: "run_scan_docs",
    repo,
    commitSha: sha,
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "success",
    origin: "public_scan",
    results,
    evidence: [],
  };
  store.putRun(run);
  for (const item of results) store.setTrust(repo, item.claimId, item.state);
  store.putRepo({
    repo,
    visibility: "public",
    connected: false,
    tokenHash: null,
    label: "Possible drift",
    driftDegrees: 30,
    latestRunId: run.id,
  });
  store.putSatellite({
    repo,
    stars: 1,
    topicCluster: "Other",
    readmeLagDays: 0,
    label: "Possible drift",
    driftDegrees: 30,
    commitSha: sha,
    scannedAt: "2026-09-26T12:00:00Z",
    tiersRun: ["static", "ai"],
    simulated: false,
  });
  return run;
}

function withScanFix(
  base: ReturnType<typeof setup>,
  scanFix?: ScanFixService,
  alerts: { runId: string; login: string }[] = [],
) {
  return createApi({
    store: base.store,
    auth: base.auth,
    events: base.events,
    now: () => new Date("2026-09-26T12:00:00Z"),
    publicUrl: "http://localhost:8787",
    ...(scanFix ? { scanFix } : {}),
    scanner: {
      async scan(name) {
        return { state: "queued", repo: name };
      },
    },
    messaging: {
      async alert() {
        return { ok: true, value: { sent: false, alertId: null } };
      },
      async scanAlert(run, githubLogin) {
        alerts.push({ runId: run.id, login: githubLogin });
        return { ok: true, value: { sent: true, alertId: "scan_1" } };
      },
    },
  });
}

test("the owner can ignore a scan finding without connecting the repo", async () => {
  const base = setup();
  base.github.permission = {
    visibility: "public",
    canRead: true,
    canAdmin: true,
  };
  const run = seed(base.store);
  const app = withScanFix(base);
  const anonymous = await json(
    app,
    `/api/runs/${run.id}/claims/c_1111111111/drop`,
    {},
  );
  expect(anonymous.status).toBe(401);
  const cookie = await login(app);
  const dropped = await json(
    app,
    `/api/runs/${run.id}/claims/c_1111111111/drop`,
    {},
    { cookie },
  );
  expect(dropped.status).toBe(200);
  expect(base.store.getTrust(repo, "c_1111111111")).toBe("dropped");
  expect(base.store.getRepo(repo)).toMatchObject({
    label: "On course",
    driftDegrees: 0,
  });
  expect(base.store.getSatellite(repo)?.label).toBe("On course");
});

test("a non-admin cannot ignore or fix a scan finding", async () => {
  const base = setup();
  base.github.permission = {
    visibility: "public",
    canRead: true,
    canAdmin: false,
  };
  const run = seed(base.store);
  let calls = 0;
  const app = withScanFix(base, {
    async fix() {
      calls += 1;
      return { ok: false, error: { code: "no_fix" } };
    },
  });
  const cookie = await login(app);
  const dropped = await json(
    app,
    `/api/runs/${run.id}/claims/c_1111111111/drop`,
    {},
    { cookie },
  );
  expect(dropped.status).toBe(403);
  const fixed = await json(app, `/api/runs/${run.id}/fix`, {}, { cookie });
  expect(fixed.status).toBe(403);
  expect(calls).toBe(0);
});

test("fix drafts a pull request for open findings with the owner's token", async () => {
  const base = setup();
  base.github.permission = {
    visibility: "public",
    canRead: true,
    canAdmin: true,
  };
  const run = seed(base.store);
  const requests: { claimIds: readonly string[]; token?: string }[] = [];
  const app = withScanFix(base, {
    async fix(target, claimIds, token) {
      requests.push({ claimIds, ...(token ? { token } : {}) });
      base.store.putClaimFix({
        repo: target.repo,
        claimId: claimIds[0] ?? "",
        pullRequestUrl: `https://github.com/${repo}/pull/7`,
        createdAt: "2026-09-26T12:00:00Z",
      });
      return {
        ok: true,
        value: {
          pullRequestUrl: `https://github.com/${repo}/pull/7`,
          commitSha: "d".repeat(40),
          fixedClaimIds: claimIds,
          skippedClaimIds: [],
        },
      };
    },
  });
  const cookie = await login(app);
  const fixed = await json(app, `/api/runs/${run.id}/fix`, {}, { cookie });
  expect(fixed.status).toBe(201);
  expect(await fixed.json()).toMatchObject({
    pullRequestUrl: `https://github.com/${repo}/pull/7`,
  });
  expect(requests).toEqual([
    { claimIds: ["c_1111111111"], token: "github-oauth-token" },
  ]);
  const read = await app.request(`/api/runs/${run.id}`);
  expect(await read.json()).toMatchObject({
    fixes: { c_1111111111: `https://github.com/${repo}/pull/7` },
    fixAvailable: true,
  });
});

test("fix reports when no model is configured", async () => {
  const base = setup();
  base.github.permission = {
    visibility: "public",
    canRead: true,
    canAdmin: true,
  };
  const run = seed(base.store);
  const app = withScanFix(base);
  const cookie = await login(app);
  const fixed = await json(app, `/api/runs/${run.id}/fix`, {}, { cookie });
  expect(fixed.status).toBe(503);
});

test("an owner's scan sends one iMessage when the scan completes", async () => {
  const base = setup();
  const run = seed(base.store);
  const alerts: { runId: string; login: string }[] = [];
  const app = withScanFix(base, undefined, alerts);
  const cookie = await login(app);
  const queued = await json(app, "/api/scan", { repo }, { cookie });
  expect(queued.status).toBe(202);
  expect(alerts).toHaveLength(0);
  base.events.publish(
    base.store.appendEvent("scan_complete", "2026-09-26T12:01:00Z", {
      repo,
      runId: run.id,
    }),
  );
  base.events.publish(
    base.store.appendEvent("scan_complete", "2026-09-26T12:02:00Z", {
      repo,
      runId: run.id,
    }),
  );
  await Promise.resolve();
  expect(alerts).toEqual([{ runId: run.id, login: "maintainer" }]);
  const other = await json(
    app,
    "/api/scan",
    { repo: "someone/else" },
    { cookie },
  );
  expect(other.status).toBe(202);
  base.events.publish(
    base.store.appendEvent("scan_complete", "2026-09-26T12:03:00Z", {
      repo: "someone/else",
      runId: run.id,
    }),
  );
  await Promise.resolve();
  expect(alerts).toHaveLength(1);
});

test("the owner can restore an ignored scan finding", async () => {
  const base = setup();
  base.github.permission = {
    visibility: "public",
    canRead: true,
    canAdmin: true,
  };
  const run = seed(base.store);
  const restored: string[] = [];
  const app = createApi({
    store: base.store,
    auth: base.auth,
    events: base.events,
    now: () => new Date("2026-09-26T12:00:00Z"),
    publicUrl: "http://localhost:8787",
    messaging: {
      async alert() {
        return { ok: true, value: { sent: false, alertId: null } };
      },
      restoreClaim(name, claimId) {
        restored.push(`${name}:${claimId}`);
      },
    },
  });
  const cookie = await login(app);
  const path = `/api/runs/${run.id}/claims/c_1111111111`;
  const early = await json(app, `${path}/restore`, {}, { cookie });
  expect(early.status).toBe(409);
  await json(app, `${path}/drop`, {}, { cookie });
  expect(base.store.getRepo(repo)?.label).toBe("On course");
  const back = await json(app, `${path}/restore`, {}, { cookie });
  expect(back.status).toBe(200);
  expect(base.store.getTrust(repo, "c_1111111111")).toBe("disputed");
  expect(base.store.getRun(run.id)?.results[0]?.state).toBe("disputed");
  expect(base.store.getRepo(repo)).toMatchObject({
    label: "Possible drift",
    driftDegrees: 30,
  });
  expect(restored).toEqual([`${repo}:c_1111111111`]);
});
