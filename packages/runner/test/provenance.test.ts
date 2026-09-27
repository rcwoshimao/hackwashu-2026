import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { flightPlanSchema } from "@ground-control/plan";
import { commandHasProvenance } from "../src/command-provenance.ts";
import { runPlan } from "../src/run-plan.ts";
import { memorySnapshot } from "../src/snapshot.ts";

const orbitRoot = join(process.cwd(), "demo/orbit-app");
const fixture = flightPlanSchema.parse(
  JSON.parse(
    readFileSync(join(orbitRoot, "flightchecks/flightplan.json"), "utf8"),
  ),
);
const commandClaim = fixture.claims.find(
  (claim) => claim.kind === "command_succeeds",
);
if (!commandClaim) throw new Error("Orbit fixture lacks a command claim");

test("runtime command requires a cited code block or package script", () => {
  const inFence = memorySnapshot({
    "README.md": "Run this:\n```sh\nnpm test\n```\n",
    "package.json": '{"scripts":{"test":"node --test"}}',
  });
  const inProse = memorySnapshot({
    "README.md": "Run npm test to check the app.\n",
    "package.json": '{"scripts":{"test":"node --test"}}',
  });
  const asScript = memorySnapshot({
    "README.md": "No command here.\n",
    "package.json": '{"scripts":{"verify":"npm test"}}',
  });
  expect(commandHasProvenance(commandClaim, "npm test", inFence)).toBe(true);
  expect(commandHasProvenance(commandClaim, "npm test", inProse)).toBe(false);
  expect(commandHasProvenance(commandClaim, "npm test", asScript)).toBe(true);
});

test("runPlan evaluates the Orbit static claims from the fixture", async () => {
  const claims = fixture.claims.filter((claim) => claim.kind === "file_exists");
  const results = await runPlan({ ...fixture, claims }, orbitRoot);
  expect(Object.values(results).map((result) => result.status)).toEqual([
    "pass",
    "pass",
    "pass",
  ]);
});
