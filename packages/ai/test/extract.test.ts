import { expect, test } from "bun:test";
import { extractCandidates } from "@ground-control/claims";
import { markdownToDocText } from "@ground-control/sources";
import {
  extractFlightPlan,
  FixtureModel,
  HeuristicModel,
  heuristicChecks,
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

test("local extraction covers the JS and TS check menu without inventing defaults", () => {
  const text = [
    "Node.js 24 or newer is required.",
    "The `dev` script starts the app. Run `npm test` to check it.",
    "The code exports `createApp` and reads `ORBIT_GREETING`.",
    "The CLI supports the `--format` flag.",
    "The server uses port 3000 by default.",
  ].join("\n");
  const doc = markdownToDocText(source, text);
  const candidates = extractCandidates(text);
  const checks = heuristicChecks({
    sectionText: text,
    candidates: candidates.map(({ signal, quote }) => ({ signal, quote })),
  });
  expect(checks).toContainEqual({
    kind: "version",
    params: { range: ">=24" },
    quote: "Node.js 24 or newer",
  });
  expect(checks).toContainEqual({
    kind: "script_exists",
    params: { script: "dev" },
    quote: "The `dev` script starts the app. Run `npm test` to check it.",
  });
  expect(checks).toContainEqual({
    kind: "script_exists",
    params: { script: "test" },
    quote: "npm test",
  });
  expect(checks).toContainEqual({
    kind: "code_reference",
    params: { name: "createApp" },
    quote: "createApp",
  });
  expect(checks).toContainEqual({
    kind: "env_var",
    params: { name: "ORBIT_GREETING" },
    quote: "ORBIT_GREETING",
  });
  expect(checks).toContainEqual({
    kind: "cli_flag",
    params: { flag: "--format" },
    quote: "--format",
  });
  expect(checks).not.toContainEqual({
    kind: "code_reference",
    params: { name: "ORBIT_GREETING" },
    quote: "ORBIT_GREETING",
  });
  expect(checks.some((check) => check.kind === "port_listens")).toBe(false);
  expect(doc.text).toBe(text);
});

test("model parameters must be backed by their cited quote", async () => {
  const text = "Use `npm run dev` and set `PORT`.\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "script_exists" as const,
            params: { script: "fake" },
            quote: "npm run dev",
          },
          {
            kind: "script_exists" as const,
            params: { script: "run" },
            quote: "npm run dev",
          },
          {
            kind: "env_var" as const,
            params: { name: "SECRET_KEY" },
            quote: "PORT",
          },
          {
            kind: "file_exists" as const,
            params: { path: "secrets.txt" },
            quote: "npm run dev",
          },
          {
            kind: "script_exists" as const,
            params: { script: "dev" },
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
  expect(result.ok && result.value.rejected).toBe(4);
  expect(
    result.ok && result.value.plan.claims.map((claim) => claim.kind),
  ).toEqual(["script_exists"]);
});

test("keyless plan extraction saves JS and TS claims as grounded static checks", async () => {
  const doc = markdownToDocText(
    source,
    [
      "Node.js 24 or newer is required.",
      "The `dev` script starts the app.",
      "The code exports `createApp` and reads `ORBIT_GREETING`.",
      "The CLI supports the `--format` flag.",
      "The server defaults to port 3000.",
    ].join("\n"),
  );
  const result = await extractFlightPlan(
    source.repo,
    [doc],
    new HeuristicModel(),
    new MemoryModelCache(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.plan.claims.map((claim) => claim.kind).sort()).toEqual([
    "cli_flag",
    "code_reference",
    "env_var",
    "script_exists",
    "version",
  ]);
  expect(
    result.value.plan.claims.every((claim) => claim.occurrences.length > 0),
  ).toBe(true);
  expect(
    result.value.plan.claims.some((claim) => claim.kind === "port_listens"),
  ).toBe(false);
});
