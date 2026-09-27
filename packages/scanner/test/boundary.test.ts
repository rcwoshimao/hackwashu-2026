import { expect, test } from "bun:test";
import { FixtureModel, MemoryModelCache } from "@ground-control/ai";
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

test("public scan leaves model-proposed runtime checks unverified", async () => {
  const readmeWithRuntime = [
    "Run `npm run dev` on port 8765. `--debug` prints logs. GET `/health` returns 200 with `ok`.",
    "",
    "```sh",
    "npm run build",
    "```",
    "",
  ].join("\n");
  const runtimeModel = new FixtureModel(
    new Map([
      [
        readmeWithRuntime,
        [
          {
            kind: "script_exists" as const,
            params: { script: "dev" },
            quote: "npm run dev",
          },
          {
            kind: "command_succeeds" as const,
            params: { command: "npm run build" },
            quote: "npm run build",
          },
          {
            kind: "port_listens" as const,
            params: { port: 8765, startScript: "dev" },
            quote: "port 8765",
          },
          {
            kind: "http_example" as const,
            params: {
              method: "GET" as const,
              path: "/health",
              expectedStatus: 200,
              expectedKeys: ["ok"],
            },
            quote: "GET `/health` returns 200 with `ok`",
          },
          {
            kind: "cli_flag" as const,
            params: { flag: "--debug" },
            quote: "--debug",
          },
        ],
      ],
    ]),
  );
  const publicRepo: PublicRepo = {
    ...base,
    readme: readmeWithRuntime,
    packageJson: JSON.stringify({
      scripts: {
        dev: 'node -e "process.exit(77)"',
        build: 'node -e "process.exit(77)"',
      },
    }),
  };
  const store = new MemoryStore();
  const scanner = new PublicScanner(
    store,
    new FixturePublicGitHub(new Map([[publicRepo.repo, publicRepo]])),
    runtimeModel,
    new MemoryModelCache(),
    () => new Date("2026-09-26T00:00:00Z"),
  );

  await scanner.scanNow(publicRepo.repo);

  const results = store.listRuns(publicRepo.repo)[0]?.results ?? [];
  expect(results).toHaveLength(5);
  expect(
    results.find((result) => result.kind === "script_exists")?.status,
  ).toBe("pass");
  for (const kind of [
    "command_succeeds",
    "port_listens",
    "http_example",
    "cli_flag",
  ]) {
    expect(results.find((result) => result.kind === kind)?.status).toBe(
      "unverified",
    );
  }
  expect(store.getSatellite(publicRepo.repo)?.tiersRun).toEqual([
    "static",
    "ai",
  ]);
});

test("connected public repos show their latest static scan and keep their connection", async () => {
  const store = new MemoryStore();
  store.putRepo({
    repo: base.repo,
    visibility: "public",
    connected: true,
    tokenHash: "token-hash",
    label: "Drifting",
    driftDegrees: 45,
    latestRunId: "run_ci",
  });
  const repos = new Map([[base.repo, base]]);
  const scanner = new PublicScanner(
    store,
    new FixturePublicGitHub(
      repos,
      new Map([[base.repo, new Set(["docs/setup.md"])]]),
    ),
    model,
    new MemoryModelCache(),
    () => new Date(),
  );
  await scanner.scanNow(base.repo);
  expect(store.getSatellite(base.repo)?.simulated).toBe(false);
  const firstRun = store.listRuns(base.repo)[0];
  expect(store.getRepo(base.repo)).toMatchObject({
    connected: true,
    visibility: "public",
    tokenHash: "token-hash",
    label: "On course",
    driftDegrees: 0,
    latestRunId: firstRun?.id,
  });
  store.putRepo({
    repo: base.repo,
    visibility: "public",
    connected: true,
    tokenHash: "token-hash",
    label: "Stale CI result",
    driftDegrees: 45,
    latestRunId: "run_ci_later",
  });
  expect(await scanner.scan(base.repo)).toEqual({
    state: "cached",
    repo: base.repo,
    commitSha: base.sha,
  });
  expect(store.getRepo(base.repo)).toMatchObject({
    connected: true,
    tokenHash: "token-hash",
    label: "On course",
    driftDegrees: 0,
    latestRunId: firstRun?.id,
  });
  repos.set(base.repo, {
    ...base,
    sha: "bbbbbbbb",
    packageJson: JSON.stringify({ scripts: {}, engines: { node: ">=20" } }),
  });
  await scanner.scanNow(base.repo);
  const latestRun = store
    .listRuns(base.repo)
    .find((item) => item.commitSha === "bbbbbbbb");
  expect(
    latestRun?.results.find((item) => item.kind === "script_exists")?.status,
  ).toBe("fail");
  expect(store.getRepo(base.repo)).toMatchObject({
    connected: true,
    tokenHash: "token-hash",
    label: "Drifting",
    driftDegrees: 30,
    latestRunId: latestRun?.id,
  });
  store.putRepo({
    repo: base.repo,
    visibility: "public",
    connected: true,
    tokenHash: "token-hash",
    label: "Stale CI result",
    driftDegrees: 45,
    latestRunId: "run_ci_later",
  });
  expect(await scanner.scanTop(1)).toEqual({
    requested: 1,
    scanned: 1,
    failed: 0,
  });
  expect(store.getRepo(base.repo)).toMatchObject({
    connected: true,
    tokenHash: "token-hash",
    label: "Drifting",
    driftDegrees: 30,
    latestRunId: latestRun?.id,
  });
});

test("public scan does not reuse a previously private connection", async () => {
  const store = new MemoryStore();
  const privateRepo = {
    repo: base.repo,
    visibility: "private" as const,
    connected: true,
    tokenHash: "private-token-hash",
    label: "Private result",
    driftDegrees: 45,
    latestRunId: "run_private",
  };
  store.putRepo(privateRepo);
  const scanner = new PublicScanner(
    store,
    new FixturePublicGitHub(new Map([[base.repo, base]])),
    model,
    new MemoryModelCache(),
    () => new Date(),
  );

  await expect(scanner.scanNow(base.repo)).rejects.toThrow(
    "private_connection_requires_refresh",
  );
  await expect(scanner.scan(base.repo)).rejects.toThrow(
    "private_connection_requires_refresh",
  );
  expect(await scanner.scanTop(1)).toEqual({
    requested: 1,
    scanned: 0,
    failed: 1,
  });
  expect(store.getRepo(base.repo)).toEqual(privateRepo);
  expect(store.getSatellite(base.repo)).toBeNull();
  expect(store.listRuns(base.repo)).toHaveLength(0);
  expect(store.listSources(base.repo)).toHaveLength(0);
});
