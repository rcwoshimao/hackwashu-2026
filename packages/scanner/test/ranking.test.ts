import { expect, test } from "bun:test";
import {
  FixtureModel,
  HeuristicModel,
  MemoryModelCache,
} from "@ground-control/ai";
import { MemoryStore } from "@ground-control/store";
import {
  FixturePublicGitHub,
  type PublicGitHubPort,
  type PublicRepo,
  PublicScanner,
} from "../src/index.ts";
import { starRanking } from "../src/ranking.ts";

function repo(name: string, stars: number, language: string): PublicRepo {
  return {
    repo: name,
    sha: `sha-${name}`,
    stars,
    language,
    topics: [],
    pushedAt: "2026-09-20T00:00:00Z",
    readmeUpdatedAt: "2026-09-10T00:00:00Z",
    readmePath: "README.md",
    readme: "Run `npm run dev`.\n",
    packageJson: JSON.stringify({ scripts: { dev: "vite" } }),
  };
}

function manyRepos(language: string, count: number, offset: number) {
  return Array.from({ length: count }, (_, index) =>
    repo(`${language}/r${index}`, 100_000 - index * 2 - offset, language),
  );
}

class CountingGitHub implements PublicGitHubPort {
  readonly searches: string[] = [];
  constructor(private readonly inner: PublicGitHubPort) {}
  getRepo(name: string) {
    return this.inner.getRepo(name);
  }
  pathExists(name: string, path: string, sha: string) {
    return this.inner.pathExists(name, path, sha);
  }
  topRepos(language: "JavaScript" | "TypeScript", page: number) {
    this.searches.push(`${language}:${page}`);
    return this.inner.topRepos(language, page);
  }
}

function fixture(repos: readonly PublicRepo[]) {
  return new CountingGitHub(
    new FixturePublicGitHub(new Map(repos.map((item) => [item.repo, item]))),
  );
}

async function collect(ranking: AsyncGenerator<string>, limit: number) {
  const names: string[] = [];
  for await (const name of ranking) {
    names.push(name);
    if (names.length === limit) break;
  }
  return names;
}

test("ranking merges both languages in descending star order", async () => {
  const github = fixture([
    repo("js/a", 900, "JavaScript"),
    repo("ts/b", 800, "TypeScript"),
    repo("js/c", 700, "JavaScript"),
    repo("ts/d", 950, "TypeScript"),
  ]);
  expect(await collect(starRanking(github), 10)).toEqual([
    "ts/d",
    "js/a",
    "ts/b",
    "js/c",
  ]);
});

test("ranking fetches the next page only when a language runs out", async () => {
  const github = fixture([
    ...manyRepos("JavaScript", 250, 0),
    ...manyRepos("TypeScript", 250, 1_000),
  ]);
  await collect(starRanking(github), 150);
  expect(github.searches).toEqual([
    "JavaScript:1",
    "TypeScript:1",
    "JavaScript:2",
  ]);
});

test("ranking stops at the page cap", async () => {
  const github = fixture(manyRepos("JavaScript", 250, 0));
  const names = await collect(starRanking(github, 2), 1_000);
  expect(names).toHaveLength(200);
  expect(github.searches).toEqual([
    "JavaScript:1",
    "TypeScript:1",
    "JavaScript:2",
  ]);
});

test("a small top scan searches one page per language", async () => {
  const github = fixture([
    ...manyRepos("JavaScript", 250, 0),
    ...manyRepos("TypeScript", 250, 1),
  ]);
  const scanner = new PublicScanner(
    new MemoryStore(),
    github,
    new HeuristicModel(),
    new MemoryModelCache(),
    () => new Date("2026-09-26T00:00:00Z"),
  );
  const summary = await scanner.scanTop(3);
  expect(summary).toEqual({ requested: 3, scanned: 3, failed: 0 });
  expect(github.searches).toEqual(["JavaScript:1", "TypeScript:1"]);
});

test("one checkable claim is enough for a label; none is still no telemetry", async () => {
  const readme = "Licensed under `LICENSE`. Run `npm start` to begin.\n";
  const single = { ...repo("js/single", 500, "JavaScript"), readme };
  const model = new FixtureModel(
    new Map([
      [
        readme,
        [
          {
            kind: "file_exists" as const,
            params: { path: "LICENSE" },
            quote: "LICENSE",
          },
          {
            kind: "command_succeeds" as const,
            params: { command: "npm start" },
            quote: "npm start",
          },
        ],
      ],
    ]),
  );
  const store = new MemoryStore();
  const github = new FixturePublicGitHub(
    new Map([[single.repo, single]]),
    new Map([[single.repo, new Set(["LICENSE"])]]),
  );
  const scan = (proposals: FixtureModel) =>
    new PublicScanner(
      store,
      github,
      proposals,
      new MemoryModelCache(),
      () => new Date("2026-09-26T00:00:00Z"),
    ).scanNow(single.repo);
  await scan(model);
  expect(store.getSatellite(single.repo)?.label).toBe("On course");
  await scan(new FixtureModel(new Map()));
  expect(store.getSatellite(single.repo)?.label).toBe("No telemetry");
});
