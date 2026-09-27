import { describe, expect, test } from "bun:test";
import {
  HeuristicModel,
  MemoryModelCache,
  type ModelPort,
} from "@ground-control/ai";
import { FixtureConfluence, FixtureWebPage } from "@ground-control/sources";
import type { SourceRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import {
  FixtureRepositoryFiles,
  isPublicIpv4,
  PinnedWebPage,
  resolveSource,
  SourceSync,
} from "../src/index.ts";

const repo = "owner/project";
const file: SourceRecord = {
  id: "readme",
  repo,
  kind: "readme",
  title: "README.md",
  url: "https://github.com/owner/project/blob/abcdef0/README.md",
  claimCount: 0,
};
const wiki: SourceRecord = {
  id: "wiki",
  repo,
  kind: "wiki",
  title: "Getting Started",
  url: "https://github.com/owner/project/wiki/Getting-Started",
  claimCount: 0,
};
const confluence: SourceRecord = {
  id: "confluence",
  repo,
  kind: "confluence",
  title: "Guide",
  url: "https://team.atlassian.net/wiki/spaces/ENG/pages/123/Guide",
  claimCount: 0,
};
const url: SourceRecord = {
  id: "url",
  repo,
  kind: "url",
  title: "Web guide",
  url: "https://docs.example.com/guide",
  claimCount: 0,
};

function setup(visibility: "public" | "private" = "public") {
  const store = new MemoryStore();
  store.putRepo({
    repo,
    visibility,
    connected: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  for (const source of [file, wiki, confluence, url]) store.putSource(source);
  const files = new Map([
    [
      `${repo}:README.md`,
      { text: "# Start\nRun `npm run dev`", version: "blob-1" },
    ],
  ]);
  const pages = new Map([
    [
      wiki.url,
      "<html><body><article><h1>Getting Started</h1><p>Run npm run dev</p></article></body></html>",
    ],
    [
      url.url,
      "<html><body><main><h1>Guide</h1><p>Use port 3000</p></main></body></html>",
    ],
  ]);
  const cloudPages = new Map([
    [
      "123",
      {
        id: "123",
        version: 4,
        storageHtml: "<h1>Guide</h1><p>Use port 3000</p>",
      },
    ],
  ]);
  let now = new Date("2026-09-26T12:00:00Z");
  const updates: { id: string; changed: boolean }[] = [];
  const sync = new SourceSync({
    store,
    files: new FixtureRepositoryFiles(files),
    web: new FixtureWebPage(pages),
    confluence: new FixtureConfluence(cloudPages),
    confluenceSite: "team.atlassian.net",
    model: new HeuristicModel(),
    cache: new MemoryModelCache(),
    now: () => now,
    onUpdate: (snapshot, changed) =>
      updates.push({ id: snapshot.sourceId, changed }),
  });
  return {
    store,
    files,
    sync,
    updates,
    setNow(value: Date) {
      now = value;
    },
  };
}

describe("connected source sync", () => {
  test("a second README record does not duplicate generated checks", async () => {
    const f = setup();
    f.store.putSource({
      ...file,
      id: "readme-copy",
      url: "https://github.com/owner/project/blob/abcdef1/README.md",
    });
    await f.sync.refresh("readme");
    const baseline = f.store.getFlightPlan(repo);
    await f.sync.refresh("readme-copy");
    const refreshed = f.store.getFlightPlan(repo);
    expect(Object.keys(refreshed?.sourceHashes ?? {})).toEqual(["readme"]);
    expect(refreshed?.claims).toEqual(baseline?.claims);
  });

  test("converts four source kinds, persists hashes and versions, and polls by kind", async () => {
    const f = setup();
    expect(await f.sync.refreshDue()).toBe(4);
    for (const source of [file, wiki, confluence, url]) {
      expect(f.sync.status(source.id)).toMatchObject({
        ok: true,
        value: {
          status: "fresh",
          contentHash: expect.any(String),
          errorCode: null,
        },
      });
      expect(
        f.store.getSourceSnapshot(source.id)?.doc?.text.length,
      ).toBeGreaterThan(0);
    }
    expect(f.store.getSourceSnapshot("readme")?.version).toBe("blob-1");
    expect(f.store.getSourceSnapshot("confluence")?.version).toBe("4");
    expect(
      f.store.getSourceSnapshot("wiki")?.doc?.spans[0]?.location.kind,
    ).toBe("wiki");
    expect(
      Object.keys(f.store.getFlightPlan(repo)?.sourceHashes ?? {}).sort(),
    ).toEqual(["confluence", "readme", "url", "wiki"]);
    expect(await f.sync.refreshDue()).toBe(0);
    f.setNow(new Date("2026-09-26T12:11:00Z"));
    expect(await f.sync.refreshDue()).toBe(2);
    expect(f.updates.filter((item) => item.changed)).toHaveLength(4);
  });

  test("unchanged fetch does not re-signal; fetch error keeps last good snapshot", async () => {
    const f = setup();
    await f.sync.refresh("readme");
    const first = f.store.getSourceSnapshot("readme");
    await f.sync.refresh("readme");
    expect(f.updates.at(-1)?.changed).toBe(false);
    f.files.delete(`${repo}:README.md`);
    const failed = await f.sync.refresh("readme");
    expect(failed).toMatchObject({
      ok: true,
      value: { status: "error", errorCode: "not_found" },
    });
    expect(f.store.getSourceSnapshot("readme")?.contentHash).toBe(
      first?.contentHash,
    );
    expect(f.store.getSourceSnapshot("readme")?.doc).toEqual(first?.doc);
  });

  test("private files need a credential and private wiki stays unavailable", async () => {
    const f = setup("private");
    expect(await f.sync.refresh("readme")).toMatchObject({
      ok: true,
      value: { status: "error", errorCode: "credential_required" },
    });
    expect(await f.sync.refresh("readme", "session-token")).toMatchObject({
      ok: true,
      value: { status: "fresh" },
    });
    expect(await f.sync.refresh("wiki", "session-token")).toMatchObject({
      ok: true,
      value: { status: "error", errorCode: "credential_required" },
    });
    const connected = f.store.getRepo(repo);
    if (!connected) throw new Error("missing fixture repository");
    f.store.putRepo({ ...connected, connected: false });
    expect(await f.sync.refresh("readme", "session-token")).toMatchObject({
      ok: true,
      value: { status: "error", errorCode: "invalid_source" },
    });
  });

  test("source URL validation and public-IP pinning reject internal targets", async () => {
    expect(
      resolveSource({
        ...file,
        url: "https://github.com/other/repo/blob/main/README.md",
      }),
    ).toMatchObject({ ok: false, error: { code: "invalid_source" } });
    expect(
      resolveSource({ ...url, url: "https://127.0.0.1/guide" }),
    ).toMatchObject({ ok: false, error: { code: "unsafe_url" } });
    expect(
      resolveSource({
        ...file,
        kind: "docs",
        url: "https://github.com/owner/project/blob/abcdef0/docs/Quick%20Start.md",
      }),
    ).toMatchObject({ ok: true, value: { path: "docs/Quick Start.md" } });
    expect(
      resolveSource({
        ...file,
        url: "https://github.com/owner/project/blob/abcdef0/%2E%2E/secrets",
      }),
    ).toMatchObject({ ok: false, error: { code: "invalid_source" } });
    expect(isPublicIpv4("93.184.215.14")).toBe(true);
    for (const blocked of [
      "127.0.0.1",
      "10.0.0.2",
      "169.254.169.254",
      "192.168.1.2",
      "::1",
    ])
      expect(isPublicIpv4(blocked)).toBe(false);
    const web = new PinnedWebPage(async () => [
      { address: "10.1.2.3", family: 4 },
    ]);
    expect(await web.readPage("https://docs.example.com/guide")).toMatchObject({
      ok: false,
      error: { code: "unsafe_url" },
    });
  });

  test("discovers README, docs, configured man/wiki, and linked pages", async () => {
    const f = setup();
    f.files.set(`${repo}:README.md`, {
      text: "# Start\n[guide](https://docs.example.com/guide)",
      version: "blob-2",
    });
    f.files.set(`${repo}:docs/setup.md`, {
      text: "# Setup",
      version: "blob-3",
    });
    f.files.set(`${repo}:man/project.1`, {
      text: ".TH PROJECT 1",
      version: "blob-4",
    });
    f.files.set(`${repo}:groundcontrol.yml`, {
      text: "sources:\n  - man: man/project.1\n  - wiki: true\n",
      version: "blob-5",
    });
    const discovered = await f.sync.discover(repo);
    expect(discovered.ok).toBe(true);
    if (!discovered.ok) return;
    expect(discovered.value.map((source) => source.kind)).toEqual([
      "readme",
      "docs",
      "man",
      "wiki",
      "url",
    ]);
    expect(
      discovered.value.find((source) => source.kind === "readme")?.id,
    ).toBe("readme");
    expect(
      discovered.value.find((source) => source.kind === "docs")?.url,
    ).toContain("/blob/fixture-sha/docs/setup.md");
  });
});

test("refresh can return before the model finishes the flight plan", async () => {
  const store = new MemoryStore();
  store.putRepo({
    repo,
    visibility: "public",
    connected: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  store.putSource(file);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const heuristic = new HeuristicModel();
  const slowModel: ModelPort = {
    model: "slow-fixture",
    async extract(input) {
      await gate;
      return heuristic.extract(input);
    },
  };
  const sync = new SourceSync({
    store,
    files: new FixtureRepositoryFiles(
      new Map([
        [`${repo}:README.md`, { text: "Run `npm run dev`", version: "1" }],
      ]),
    ),
    web: new FixtureWebPage(new Map()),
    confluence: new FixtureConfluence(new Map()),
    model: slowModel,
    cache: new MemoryModelCache(),
    now: () => new Date("2026-09-26T12:00:00Z"),
  });
  const status = await sync.refresh("readme", undefined, {
    waitForPlan: false,
  });
  expect(status).toMatchObject({ ok: true, value: { status: "fresh" } });
  expect(store.getFlightPlan(repo)).toBeNull();
  release();
  for (
    let attempt = 0;
    attempt < 50 && !store.getFlightPlan(repo);
    attempt += 1
  )
    await Bun.sleep(5);
  expect(store.getFlightPlan(repo)).not.toBeNull();
});
