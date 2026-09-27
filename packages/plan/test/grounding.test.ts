import { expect, test } from "bun:test";
import { docTextSchema } from "@ground-control/sources";
import fc from "fast-check";
import { claimGroundedInDocText, claimId, claimSchema } from "../src/index";

function groundedDoc(text: string) {
  const origin = {
    kind: "file" as const,
    sourceId: "readme",
    path: "README.md",
    lineStart: 1,
    lineEnd: 1,
  };
  return docTextSchema.parse({
    sourceId: "readme",
    text,
    spans: [
      {
        kind: "text",
        startOffset: 0,
        endOffset: text.length,
        location: { ...origin, startOffset: 0, endOffset: text.length },
      },
    ],
  });
}

function groundedClaim(prefix: string, quote: string) {
  return claimSchema.parse({
    kind: "file_exists",
    params: { path: ".env.example" },
    id: claimId("readme", quote, "file_exists", { path: ".env.example" }),
    sourceId: "readme",
    occurrences: [
      {
        quote,
        location: {
          kind: "file",
          sourceId: "readme",
          path: "README.md",
          lineStart: 1,
          lineEnd: 1,
          startOffset: prefix.length,
          endOffset: prefix.length + quote.length,
        },
      },
    ],
    tier: "static",
  });
}

function groundedExample(
  prefix: string,
  quote: string,
  suffix: string,
): boolean {
  return claimGroundedInDocText(
    groundedClaim(prefix, quote),
    groundedDoc(`${prefix}${quote}${suffix}`),
  );
}

test("every claim occurrence is grounded by exact text at its location", () => {
  fc.assert(
    fc.property(
      fc.string({ maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 40 }),
      fc.string({ maxLength: 20 }),
      groundedExample,
    ),
    { numRuns: 1000 },
  );
});

test("a quote elsewhere in the document does not ground a claim", () => {
  const doc = docTextSchema.parse({
    sourceId: "readme",
    text: "port 3000 port 8080",
    spans: [
      {
        kind: "text",
        startOffset: 0,
        endOffset: 19,
        location: {
          kind: "file",
          sourceId: "readme",
          path: "README.md",
          lineStart: 1,
          lineEnd: 1,
          startOffset: 0,
          endOffset: 19,
        },
      },
    ],
  });
  const quote = "port 8080";
  const item = claimSchema.parse({
    kind: "port_listens",
    params: { port: 8080, startScript: "dev" },
    id: claimId("readme", quote, "port_listens", {
      port: 8080,
      startScript: "dev",
    }),
    sourceId: "readme",
    occurrences: [
      {
        quote,
        location: {
          kind: "file",
          sourceId: "readme",
          path: "README.md",
          lineStart: 1,
          lineEnd: 1,
          startOffset: 0,
          endOffset: 9,
        },
      },
    ],
    tier: "runtime",
  });
  expect(claimGroundedInDocText(item, doc)).toBe(false);
});
