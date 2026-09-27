import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AppStore, RepoRecord } from "../src/index.ts";
import { MemoryStore, SqliteStore } from "../src/index.ts";

const repo: RepoRecord = {
  repo: "owner/project",
  visibility: "public",
  connected: false,
  tokenHash: null,
  label: "No telemetry",
  driftDegrees: 0,
  latestRunId: null,
};

function exercise(store: AppStore): void {
  store.putRepo(repo);
  expect(store.getRepo(repo.repo)).toEqual(repo);
  expect(store.listRepos()).toEqual([repo]);
  store.putSource({
    id: "source",
    repo: repo.repo,
    kind: "docs",
    title: "Guide",
    url: "https://example.com/guide",
    claimCount: 2,
  });
  expect(store.listSources(repo.repo)).toHaveLength(1);
  expect(store.findSourceByUrl("https://example.com/guide")).toHaveLength(1);
  store.setTrust(repo.repo, "claim", "confirmed");
  expect(store.getTrust(repo.repo, "claim")).toBe("confirmed");
  store.setSkyMode("cached");
  expect(store.getSkyMode()).toBe("cached");
  expect(store.consumeScanQuota("ip", 1_000, 1, 3_600_000)).toBe(true);
  expect(store.consumeScanQuota("ip", 2_000, 1, 3_600_000)).toBe(false);
  expect(store.consumeScanQuota("ip", 3_601_001, 1, 3_600_000)).toBe(true);
  store.putSession({
    idHash: "hash",
    login: "navi",
    encryptedToken: "cipher",
    expiresAt: 100,
  });
  expect(store.getSession("hash")?.login).toBe("navi");
  store.deleteSession("hash");
  expect(store.getSession("hash")).toBeNull();
  const event = store.appendEvent("changed", "2026-09-26T00:00:00Z", {
    repo: repo.repo,
  });
  expect(store.eventsAfter(0)).toEqual([event]);
  expect(store.eventsAfter(event.sequence)).toEqual([]);
}

describe("stores", () => {
  test("memory port", () => exercise(new MemoryStore()));
  test("SQLite port and numbered migration", () => {
    const store = new SqliteStore(":memory:");
    try {
      exercise(store);
    } finally {
      store.close();
    }
  });
  test("SQLite reopens source snapshots and combined flight plans", () => {
    const directory = mkdtempSync(join(tmpdir(), "gc-store-test-"));
    const path = join(directory, "store.db");
    const first = new SqliteStore(path);
    try {
      first.putSourceSnapshot({
        sourceId: "readme",
        repo: repo.repo,
        status: "fresh",
        contentHash: "a".repeat(64),
        version: "blob-sha",
        fetchedAt: "2026-09-26T00:00:00Z",
        errorCode: null,
        doc: { sourceId: "readme", text: "Run npm run dev", spans: [] },
      });
      first.putFlightPlan({
        repo: repo.repo,
        sourceHashes: { readme: "a".repeat(64) },
        claims: [],
      });
    } finally {
      first.close();
    }
    const reopened = new SqliteStore(path);
    try {
      expect(reopened.getSourceSnapshot("readme")?.doc?.text).toBe(
        "Run npm run dev",
      );
      expect(reopened.getFlightPlan(repo.repo)?.sourceHashes.readme).toBe(
        "a".repeat(64),
      );
    } finally {
      reopened.close();
      if (resolve(directory).startsWith(resolve(tmpdir(), "gc-store-test-"))) {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });
});
