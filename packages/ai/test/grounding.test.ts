import { expect, test } from "bun:test";
import { markdownToDocText } from "@ground-control/sources";
import { groundedParameters } from "../src/grounding.ts";
import {
  extractFlightPlan,
  FixtureModel,
  MemoryModelCache,
} from "../src/index.ts";

const source = {
  id: "readme",
  repo: "example/orbit",
  kind: "readme" as const,
  path: "README.md",
};

test("file paths and every version bound need exact quote evidence", () => {
  expect(
    groundedParameters(
      { kind: "file_exists", params: { path: "config.json" } },
      "Open `config.json.bak`.",
      "Open `config.json.bak`.",
    ),
  ).toBe(false);
  expect(
    groundedParameters(
      { kind: "version", params: { range: ">=24 <99" } },
      "Node.js 24 or newer",
      "Node.js 24 or newer",
    ),
  ).toBe(false);
  expect(
    groundedParameters(
      { kind: "version", params: { range: "<24" } },
      "Node.js 24 or newer",
      "Node.js 24 or newer",
    ),
  ).toBe(false);
});

test("a port claim cannot invent the server start script", async () => {
  const text = "The server listens on port 3000.\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "port_listens" as const,
            params: { port: 3000, startScript: "dev" },
            quote: "port 3000",
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
  expect(result.ok && result.value.rejected).toBe(1);
  expect(result.ok && result.value.plan.claims).toEqual([]);
});

test("a cited port accepts a documented start script in the same section", async () => {
  const text = "The `dev` script starts the server on port 3000.\n";
  const doc = markdownToDocText(source, text);
  const model = new FixtureModel(
    new Map([
      [
        text,
        [
          {
            kind: "port_listens" as const,
            params: { port: 3000, startScript: "dev" },
            quote: "port 3000",
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
  expect(result.ok && result.value.rejected).toBe(0);
  expect(
    result.ok && result.value.plan.claims.map((claim) => claim.kind),
  ).toEqual(["port_listens"]);
});
