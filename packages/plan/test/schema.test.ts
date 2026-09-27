import { expect, test } from "bun:test";
import {
  checkKindSchema,
  checkSchema,
  claimEvidenceSchema,
  claimId,
  claimSchema,
  evidenceSchema,
  factKey,
  flightPlanSchema,
  trustStateSchema,
} from "../src/index";

const location = {
  kind: "file" as const,
  sourceId: "readme",
  path: "README.md",
  lineStart: 4,
  lineEnd: 4,
  startOffset: 20,
  endOffset: 36,
};
const check = {
  kind: "file_exists" as const,
  params: { path: ".env.example" },
};
const quote = "Copy .env.example";
const claim = {
  ...check,
  id: claimId("readme", quote, check.kind, check.params),
  sourceId: "readme",
  occurrences: [{ quote, location }],
  tier: "static" as const,
};

test("nine kinds parse with their distinct parameters", () => {
  const checks = [
    check,
    { kind: "script_exists", params: { script: "dev" } },
    { kind: "code_reference", params: { name: "createClient" } },
    { kind: "env_var", params: { name: "DATABASE_URL" } },
    { kind: "version", params: { range: ">=24" } },
    { kind: "cli_flag", params: { flag: "--format" } },
    {
      kind: "command_succeeds",
      params: { command: "npm run build", timeoutMs: 120000 },
    },
    {
      kind: "port_listens",
      params: { port: 3000, startScript: "dev", timeoutMs: 30000 },
    },
    {
      kind: "http_example",
      params: {
        method: "GET",
        path: "/api/health",
        expectedStatus: 200,
        expectedKeys: ["status"],
      },
    },
  ];
  for (const item of checks)
    expect(checkSchema.safeParse(item).success).toBe(true);
  expect(checkKindSchema.options).toHaveLength(9);
});

test("invalid check kinds and parameters are rejected", () => {
  expect(
    checkSchema.safeParse({ kind: "shell", params: { command: "rm -rf ." } })
      .success,
  ).toBe(false);
  expect(
    checkSchema.safeParse({
      kind: "command_succeeds",
      params: { command: "curl example.com" },
    }).success,
  ).toBe(false);
  expect(
    checkSchema.safeParse({
      kind: "port_listens",
      params: { port: 65536, startScript: "dev" },
    }).success,
  ).toBe(false);
  expect(
    checkSchema.safeParse({
      kind: "port_listens",
      params: { port: 3000, startScript: "dev", timeoutMs: 30001 },
    }).success,
  ).toBe(false);
  expect(
    checkSchema.safeParse({
      kind: "command_succeeds",
      params: { command: "npm test", timeoutMs: 120001 },
    }).success,
  ).toBe(false);
  expect(
    checkSchema.safeParse({
      kind: "file_exists",
      params: { path: "../secret" },
    }).success,
  ).toBe(false);
});

test("runtime command schema rejects shell chaining and substitution", () => {
  for (const command of [
    "npm test; touch bad",
    "npm test && touch bad",
    "npm test || touch bad",
    "npm test | node",
    "npm test > out",
    "npm test `touch bad`",
    "npm test $(touch bad)",
    "npm test\nnode bad",
    " npm test",
    "npm test ",
  ]) {
    expect(
      checkSchema.safeParse({ kind: "command_succeeds", params: { command } })
        .success,
    ).toBe(false);
  }
});

test("claims bind exact identities to occurrence quotes and locations", () => {
  expect(claimSchema.safeParse(claim).success).toBe(true);
  expect(
    claimSchema.safeParse({
      ...claim,
      occurrences: [
        { quote, location },
        {
          quote: "Copy  .env.example",
          location: { ...location, lineStart: 9, lineEnd: 9 },
        },
      ],
    }).success,
  ).toBe(true);
  expect(claimSchema.safeParse({ ...claim, id: "c_0000000000" }).success).toBe(
    false,
  );
  expect(
    claimSchema.safeParse({
      ...claim,
      occurrences: [
        { quote, location: { ...location, sourceId: "different" } },
      ],
    }).success,
  ).toBe(false);
  expect(
    claimSchema.safeParse({
      ...claim,
      occurrences: [{ quote: "Other claim", location }],
    }).success,
  ).toBe(false);
  expect(claimSchema.safeParse({ ...claim, tier: "runtime" }).success).toBe(
    false,
  );
});

test("flight plans reject duplicate IDs while retaining repeated occurrences", () => {
  const plan = {
    repo: "team/repo",
    sourceHashes: { readme: "a".repeat(64) },
    claims: [claim],
  };
  expect(flightPlanSchema.safeParse(plan).success).toBe(true);
  expect(
    flightPlanSchema.safeParse({ ...plan, claims: [claim, claim] }).success,
  ).toBe(false);
  expect(
    flightPlanSchema.safeParse({ ...plan, sourceHashes: { readme: "short" } })
      .success,
  ).toBe(false);
  expect(
    flightPlanSchema.safeParse({ ...plan, sourceHashes: {} }).success,
  ).toBe(false);
});

test("trust states are closed to four values", () => {
  for (const state of ["unconfirmed", "confirmed", "disputed", "dropped"])
    expect(trustStateSchema.safeParse(state).success).toBe(true);
  expect(trustStateSchema.safeParse("flaky").success).toBe(false);
});

test("evidence validates fact grouping, locations, and output limit", () => {
  const occurrence = {
    claimId: claim.id,
    sourceId: "readme",
    sourceKind: "readme",
    location,
    quote,
    expected: "File exists",
    actual: "File missing",
    lastPassSha: "a".repeat(40),
    firstFailSha: "b".repeat(40),
    relatedFiles: ["README.md"],
    suspectedCommit: { sha: "b".repeat(40), author: "developer" },
    deepLink: "https://github.com/team/repo/blob/main/README.md#L4",
    fix: { kind: "pr" },
  };
  expect(claimEvidenceSchema.safeParse(occurrence).success).toBe(true);
  expect(
    claimEvidenceSchema.safeParse({
      ...occurrence,
      actual: Array(21).fill("line").join("\n"),
    }).success,
  ).toBe(false);
  const group = {
    ...check,
    factKey: factKey(check.kind, check.params),
    claims: [occurrence],
  };
  expect(evidenceSchema.safeParse(group).success).toBe(true);
  expect(evidenceSchema.safeParse({ ...group, factKey: "wrong" }).success).toBe(
    false,
  );
});
