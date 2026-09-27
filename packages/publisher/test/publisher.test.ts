import { expect, test } from "bun:test";
import { type FlightPlan, flightPlanSchema } from "@ground-control/plan";
import { MemoryStore } from "@ground-control/store";
import type { Octokit } from "@octokit/rest";
import {
  FakePlanWriter,
  OctokitPlanWriter,
  publishFlightPlan,
} from "../src/index.ts";

const plan: FlightPlan = flightPlanSchema.parse({
  repo: "example/orbit",
  sourceHashes: {},
  claims: [],
});

test("only connected repos publish deterministic flight checks", async () => {
  const store = new MemoryStore();
  const writer = new FakePlanWriter();
  store.putFlightPlan(plan);
  expect(await publishFlightPlan(store, plan.repo, writer)).toEqual({
    ok: false,
    error: { code: "not_connected" },
  });
  store.putRepo({
    repo: plan.repo,
    visibility: "private",
    connected: true,
    tokenHash: "hash",
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  const first = await publishFlightPlan(store, plan.repo, writer);
  const second = await publishFlightPlan(store, plan.repo, writer);
  expect(first.ok && first.value.state).toBe("published");
  expect(second.ok && second.value.state).toBe("unchanged");
  expect(writer.writes).toEqual([plan.repo]);
  expect(writer.files.get(plan.repo)?.map((file) => file.path)).toEqual([
    "flightchecks/flightplan.json",
    "flightchecks/flight.test.mjs",
    "flightchecks/runner.mjs",
  ]);
});

test("public docs-only connections do not publish generated flight checks", async () => {
  const store = new MemoryStore();
  const writer = new FakePlanWriter();
  store.putFlightPlan(plan);
  store.putRepo({
    repo: plan.repo,
    visibility: "public",
    connected: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });

  expect(await publishFlightPlan(store, plan.repo, writer)).toEqual({
    ok: false,
    error: { code: "runtime_not_enabled" },
  });
  expect(writer.writes).toEqual([]);
  expect(writer.files.size).toBe(0);
  const connected = store.getRepo(plan.repo);
  if (connected === null) throw new Error("missing connected repo");
  store.putRepo({
    ...connected,
    tokenHash: "scoped-hash",
    runtimeEnabled: true,
  });
  const enabled = await publishFlightPlan(store, plan.repo, writer);
  expect(enabled.ok && enabled.value.state).toBe("published");
  expect(writer.writes).toEqual([plan.repo]);
});

test("GitHub writer rejects a repo made public since connection", async () => {
  let metadataCalls = 0;
  const client = {
    rest: {
      repos: {
        get: async () => {
          metadataCalls++;
          return { data: { private: false } };
        },
      },
    },
  } as unknown as Octokit;
  const writer = new OctokitPlanWriter("unused", client);
  const result = await writer.publish(
    plan.repo,
    [
      { path: "flightchecks/flightplan.json", content: "{}" },
      { path: "flightchecks/flight.test.mjs", content: "" },
      { path: "flightchecks/runner.mjs", content: "" },
    ],
    "private",
  );

  expect(result).toEqual({
    ok: false,
    error: { code: "repository_visibility_changed" },
  });
  expect(metadataCalls).toBe(1);
});
