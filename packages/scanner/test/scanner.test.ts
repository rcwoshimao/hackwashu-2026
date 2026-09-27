import { expect, test } from "bun:test";
import {
  FixtureModel,
  HeuristicModel,
  MemoryModelCache,
} from "@ground-control/ai";
import { MemoryStore } from "@ground-control/store";
import {
  FixturePublicGitHub,
  type PublicRepo,
  PublicScanner,
} from "../src/index.ts";

const readme =
  "Run `npm run dev`. The guide is `docs/setup.md`. Node >=20 is required.\n";
const base: PublicRepo = {
  repo: "example/orbit",
  sha: "aaaaaaaa",
  stars: 250,
  language: "TypeScript",
  topics: ["vite", "frontend"],
  pushedAt: "2026-09-20T00:00:00Z",
  readmeUpdatedAt: "2026-09-10T00:00:00Z",
  readmePath: "README.md",
  readme,
  packageJson: JSON.stringify({
    scripts: { dev: "vite" },
    engines: { node: ">=20" },
  }),
};
const model = new FixtureModel(
  new Map([
    [
      readme,
      [
        {
          kind: "script_exists" as const,
          params: { script: "dev" },
          quote: "npm run dev",
        },
        {
          kind: "file_exists" as const,
          params: { path: "docs/setup.md" },
          quote: "docs/setup.md",
        },
        {
          kind: "version" as const,
          params: { range: ">=20" },
          quote: "Node >=20",
        },
      ],
    ],
  ]),
);

test("public scan records real static evidence without running repository code", async () => {
  const store = new MemoryStore();
  const github = new FixturePublicGitHub(
    new Map([[base.repo, base]]),
    new Map([[base.repo, new Set(["docs/setup.md"])]]),
  );
  const events: string[] = [];
  const scanner = new PublicScanner(
    store,
    github,
    model,
    new MemoryModelCache(),
    () => new Date("2026-09-26T00:00:00Z"),
    (event) => events.push(event.kind),
  );
  await scanner.scanNow(base.repo);
  const satellite = store.getSatellite(base.repo);
  expect(satellite?.simulated).toBe(false);
  expect(satellite?.readmeLagDays).toBe(10);
  expect(satellite?.topicCluster).toBe("UI libraries");
  expect(satellite?.label).toBe("On course");
  expect(satellite?.tiersRun).toEqual(["static", "ai"]);
  const run = satellite && store.listRuns(base.repo)[0];
  expect(run?.results).toHaveLength(3);
  expect(
    run?.results.every(
      (result) => result.state === "confirmed" && result.status === "pass",
    ),
  ).toBe(true);
  expect(events).toContain("scan_complete");
});

test("a previously passing claim becomes confirmed drift on a later commit", async () => {
  const store = new MemoryStore();
  const repos = new Map([[base.repo, base]]);
  const github = new FixturePublicGitHub(
    repos,
    new Map([[base.repo, new Set(["docs/setup.md"])]]),
  );
  const scanner = new PublicScanner(
    store,
    github,
    model,
    new MemoryModelCache(),
    () => new Date(),
  );
  await scanner.scanNow(base.repo);
  repos.set(base.repo, {
    ...base,
    sha: "bbbbbbbb",
    packageJson: JSON.stringify({ scripts: {}, engines: { node: ">=20" } }),
  });
  await scanner.scanNow(base.repo);
  const run = store
    .listRuns(base.repo)
    .find((item) => item.commitSha === "bbbbbbbb");
  expect(run?.verdict).toBe("failure");
  expect(
    run?.results.find((item) => item.kind === "script_exists")?.status,
  ).toBe("fail");
  expect(store.getSatellite(base.repo)?.label).toBe("Drifting");
  expect(store.getSatellite(base.repo)?.driftDegrees).toBe(30);
});

test("first failure is disputed and cannot fail verdict", async () => {
  const store = new MemoryStore();
  const github = new FixturePublicGitHub(
    new Map([
      [
        base.repo,
        {
          ...base,
          packageJson: JSON.stringify({ engines: { node: ">=20" } }),
        },
      ],
    ]),
  );
  const scanner = new PublicScanner(
    store,
    github,
    model,
    new MemoryModelCache(),
    () => new Date(),
  );
  await scanner.scanNow(base.repo);
  const run = store.listRuns(base.repo)[0];
  expect(run?.verdict).toBe("success");
  expect(run?.results.some((item) => item.state === "disputed")).toBe(true);
  expect(store.getSatellite(base.repo)?.label).toBe("Possible drift");
});

test("top scan reuses a saved commit at the requested tier", async () => {
  const store = new MemoryStore();
  const events: string[] = [];
  const scanner = new PublicScanner(
    store,
    new FixturePublicGitHub(new Map([[base.repo, base]])),
    model,
    new MemoryModelCache(),
    () => new Date("2026-09-26T00:00:00Z"),
    (event) => events.push(event.kind),
  );
  expect(await scanner.scanTop(1)).toEqual({
    requested: 1,
    scanned: 1,
    failed: 0,
  });
  expect(await scanner.scanTop(1)).toEqual({
    requested: 1,
    scanned: 1,
    failed: 0,
  });
  expect(events).toEqual(["scan_complete"]);
});

test("AI scan upgrades a saved static-only satellite", async () => {
  const store = new MemoryStore();
  const github = new FixturePublicGitHub(new Map([[base.repo, base]]));
  const cache = new MemoryModelCache();
  const staticScanner = new PublicScanner(
    store,
    github,
    new HeuristicModel(),
    cache,
    () => new Date(),
  );
  await staticScanner.scanTop(1);
  expect(store.getSatellite(base.repo)?.tiersRun).toEqual(["static"]);
  const aiScanner = new PublicScanner(
    store,
    github,
    model,
    cache,
    () => new Date(),
  );
  await aiScanner.scanTop(1);
  expect(store.getSatellite(base.repo)?.tiersRun).toEqual(["static", "ai"]);
});
