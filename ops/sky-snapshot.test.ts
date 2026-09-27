import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  type AppStore,
  MemoryStore,
  type SatelliteRecord,
} from "@ground-control/store";
import { parseSkySnapshot, restoreSky, snapshotSky } from "./sky-snapshot.ts";

function satellite(repo: string, extra: Partial<SatelliteRecord> = {}) {
  return {
    repo,
    stars: 1000,
    topicCluster: "Back end",
    readmeLagDays: 12,
    label: "On course",
    driftDegrees: 0,
    commitSha: "abc123",
    scannedAt: "2026-09-26T10:00:00.000Z",
    tiersRun: ["static", "ai"],
    simulated: false,
    ...extra,
  } satisfies SatelliteRecord;
}

function scanned(store: AppStore, repo: string, visibility = "public") {
  store.putRepo({
    repo,
    visibility: visibility === "private" ? "private" : "public",
    connected: true,
    tokenHash: "secret-hash",
    label: "On course",
    driftDegrees: 0,
    latestRunId: `run-${repo}`,
  });
  store.putRun({
    id: `run-${repo}`,
    repo,
    commitSha: "abc123",
    createdAt: "2026-09-26T10:00:00.000Z",
    verdict: "success",
    results: [],
    evidence: [],
  });
  store.putSource({
    id: `readme-${repo}`,
    repo,
    kind: "readme",
    title: "README.md",
    url: `https://github.com/${repo}/blob/abc123/README.md`,
    claimCount: 1,
  });
  store.setTrust(repo, "claim-1", "confirmed");
  store.putSatellite(satellite(repo));
}

function withTrustedRun(store: AppStore, repo: string): void {
  const run = store.getRun(`run-${repo}`);
  assert.ok(run);
  store.putRun({
    ...run,
    results: [
      {
        claimId: "claim-1",
        sourceId: `readme-${repo}`,
        quote: "LICENSE",
        state: "confirmed",
        status: "pass",
        expected: "{}",
        actual: "pass",
        deepLink: null,
        kind: "file_exists",
        params: { path: "LICENSE" },
      },
    ],
  });
}

test("a snapshot round-trips real public scans into a fresh store", () => {
  const source = new MemoryStore();
  scanned(source, "acme/api");
  withTrustedRun(source, "acme/api");
  const text = JSON.stringify(snapshotSky(source, "2026-09-26T12:00:00Z"));
  const target = new MemoryStore();
  const restored = restoreSky(target, parseSkySnapshot(text));
  assert.deepEqual(restored, { satellites: 1, runs: 1 });
  assert.deepEqual(target.getSatellite("acme/api"), satellite("acme/api"));
  assert.equal(target.getRun("run-acme/api")?.results.length, 1);
  assert.equal(target.listSources("acme/api").length, 1);
  assert.equal(target.getTrust("acme/api", "claim-1"), "confirmed");
  assert.equal(target.getSkyMode(), "live");
});

test("snapshots leave out simulated, private, and token data", () => {
  const store = new MemoryStore();
  scanned(store, "acme/api");
  scanned(store, "acme/secret", "private");
  store.putSatellite(satellite("simulated/repo-001", { simulated: true }));
  const snapshot = snapshotSky(store, "2026-09-26T12:00:00Z");
  assert.deepEqual(
    snapshot.satellites.map((item) => item.repo),
    ["acme/api"],
  );
  assert.equal(snapshot.repos[0]?.tokenHash, null);
  assert.equal(snapshot.repos[0]?.connected, false);
  assert.ok(!JSON.stringify(snapshot).includes("secret-hash"));
});

test("restore keeps local connections, private repos, and newer scans", () => {
  const source = new MemoryStore();
  scanned(source, "acme/api");
  scanned(source, "acme/web");
  scanned(source, "acme/now-private");
  const snapshot = snapshotSky(source, "2026-09-26T12:00:00Z");
  const target = new MemoryStore();
  scanned(target, "acme/api");
  target.putSatellite(
    satellite("acme/web", { scannedAt: "2026-09-27T00:00:00.000Z" }),
  );
  scanned(target, "acme/now-private", "private");
  const restored = restoreSky(target, snapshot);
  assert.equal(restored.satellites, 1);
  assert.equal(target.getRepo("acme/api")?.tokenHash, "secret-hash");
  assert.equal(
    target.getSatellite("acme/web")?.scannedAt,
    "2026-09-27T00:00:00.000Z",
  );
  assert.equal(target.getRepo("acme/now-private")?.visibility, "private");
});

test("a malformed snapshot is rejected", () => {
  assert.throws(
    () => parseSkySnapshot(JSON.stringify({ version: 2 })),
    /invalid_sky_snapshot/,
  );
});
