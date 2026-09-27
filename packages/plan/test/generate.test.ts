import { expect, test } from "bun:test";
import fc from "fast-check";
import { claimId, flightPlanSchema, planToTests } from "../src/index";

function oneClaimPlan(quote: string) {
  const params = { path: ".env.example" };
  return flightPlanSchema.parse({
    repo: "team/orbit-app",
    sourceHashes: { readme: "a".repeat(64) },
    claims: [
      {
        id: claimId("readme", quote, "file_exists", params),
        sourceId: "readme",
        kind: "file_exists",
        params,
        tier: "static",
        occurrences: [
          {
            quote,
            location: {
              kind: "file",
              sourceId: "readme",
              path: "README.md",
              lineStart: 4,
              lineEnd: 4,
              startOffset: 0,
              endOffset: quote.length,
            },
          },
        ],
      },
    ],
  });
}

test("same flight plan always produces byte-identical tests", () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1, maxLength: 80 }), (quote) => {
      const plan = oneClaimPlan(quote);
      const first = planToTests(plan);
      const copied = structuredClone(plan);
      return first === planToTests(copied);
    }),
    { numRuns: 1000 },
  );
});

test("generated tests import the local runner and name the cited line", () => {
  const output = planToTests(oneClaimPlan('Copy ".env.example"'));
  expect(output).toContain('import { runPlan } from "./runner.mjs"');
  expect(output).toContain("README.md:4");
  expect(output).toContain("Runner returned no result");
  expect(output).toContain('Copy \\".env.example\\"');
});
