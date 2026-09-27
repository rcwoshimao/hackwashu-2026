import { expect, test } from "bun:test";
import { markdownToDocText } from "@ground-control/sources";
import {
  extractFlightPlan,
  FixtureModel,
  HeuristicModel,
  MemoryModelCache,
  SqliteModelCache,
} from "../src/index.ts";

const source = {
  id: "readme",
  repo: "example/orbit",
  kind: "readme" as const,
  path: "README.md",
};

test("exact quotes become stable claims and unchanged sections reuse cache", async () => {
  const text = "Run `npm run dev` to start.\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "script_exists" as const,
            params: { script: "dev" },
            quote: "npm run dev",
          },
          {
            kind: "script_exists" as const,
            params: { script: "fake" },
            quote: "not in document",
          },
        ],
      ],
    ]),
  );
  const cache = new MemoryModelCache();
  const first = await extractFlightPlan(source.repo, [doc], model, cache);
  const second = await extractFlightPlan(source.repo, [doc], model, cache);
  expect(first.ok && first.value.plan.claims).toHaveLength(1);
  expect(first.ok && first.value.rejected).toBe(1);
  expect(first.ok && first.value.modelCalls).toBe(1);
  expect(second.ok && second.value.modelCalls).toBe(0);
  expect(first.ok && second.ok && first.value.plan).toEqual(
    second.ok && second.value.plan,
  );
});

test("runtime commands require exact code-block provenance", async () => {
  const text = "Run npm test.\n\n```sh\nnpm run dev\n```\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "command_succeeds" as const,
            params: { command: "npm test" },
            quote: "npm test",
          },
          {
            kind: "command_succeeds" as const,
            params: { command: "npm run dev" },
            quote: "npm run dev",
          },
        ],
      ],
    ]),
  );
  const result = await extractFlightPlan(
    source.repo,
    [doc],
    model,
    new MemoryModelCache(),
  );
  expect(
    result.ok && result.value.plan.claims.map((claim) => claim.kind),
  ).toEqual(["command_succeeds"]);
  expect(result.ok && result.value.rejected).toBe(1);
});

test("local model creates static checks without keys or code execution", async () => {
  const doc = markdownToDocText(
    source,
    "Run `npm run dev` and see `docs/setup.md`.\n",
  );
  const result = await extractFlightPlan(
    source.repo,
    [doc],
    new HeuristicModel(),
    new MemoryModelCache(),
  );
  expect(
    result.ok && result.value.plan.claims.map((claim) => claim.kind).sort(),
  ).toEqual(["file_exists", "script_exists"]);
});

test("SQLite model cache keeps only validated proposals", () => {
  const cache = new SqliteModelCache(":memory:");
  const checks = [
    {
      kind: "file_exists" as const,
      params: { path: "docs/setup.md" },
      quote: "docs/setup.md",
    },
  ];
  cache.set("key", checks);
  expect(cache.get("key")).toEqual(checks);
  expect(cache.get("missing")).toBeNull();
  cache.close();
});

test("a repeated exact quote keeps both source locations", async () => {
  const text = "Use `docs/setup.md`. Later, revisit `docs/setup.md`.\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "file_exists" as const,
            params: { path: "docs/setup.md" },
            quote: "docs/setup.md",
          },
        ],
      ],
    ]),
  );
  const result = await extractFlightPlan(
    source.repo,
    [doc],
    model,
    new MemoryModelCache(),
  );
  expect(result.ok && result.value.plan.claims[0]?.occurrences).toHaveLength(2);
});
