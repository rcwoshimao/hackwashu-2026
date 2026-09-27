import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson, flightPlanSchema } from "@ground-control/plan";
import { MemoryStore } from "@ground-control/store";
import { ingestTelemetry, telemetrySchema } from "../src/telemetry.ts";

function fixture(name: string) {
  return telemetrySchema.parse(
    JSON.parse(
      readFileSync(join(process.cwd(), "fixtures/integration", name), "utf8"),
    ),
  );
}

test("Hussein handoff telemetry matches Orbit claims and groups drift for teammates", () => {
  const plan = flightPlanSchema.parse(
    JSON.parse(
      readFileSync(
        join(process.cwd(), "demo/orbit-app/flightchecks/flightplan.json"),
        "utf8",
      ),
    ),
  );
  const baseline = fixture("hussein-baseline.json");
  const drift = fixture("hussein-drift.json");
  for (const input of [baseline, drift]) {
    expect(input.repo).toBe("team/orbit-app");
    for (const result of input.results) {
      const claim = plan.claims.find((item) => item.id === result.claimId);
      if (!claim) throw new Error(`Unknown Orbit claim ${result.claimId}`);
      expect(result.kind).toBe(claim.kind);
      expect(canonicalJson(result.params)).toBe(canonicalJson(claim.params));
      expect(
        claim.occurrences.some((item) => item.quote === result.quote),
      ).toBe(true);
    }
  }
  const store = new MemoryStore();
  store.putRepo({
    repo: baseline.repo,
    visibility: "private",
    connected: true,
    tokenHash: "fixture-token-hash",
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  const first = ingestTelemetry(
    store,
    baseline,
    new Date("2026-09-26T10:00:00Z"),
  );
  expect(first.verdict).toBe("success");
  expect(first.results.every((item) => item.state === "confirmed")).toBe(true);
  const second = ingestTelemetry(
    store,
    drift,
    new Date("2026-09-26T10:05:00Z"),
  );
  expect(second.verdict).toBe("failure");
  expect(second.pullRequestNumber).toBe(42);
  expect(second.evidence).toHaveLength(1);
  expect(second.evidence[0]?.kind).toBe("port_listens");
  expect(second.evidence[0]?.claims.map((item) => item.claimId)).toEqual([
    "c_8ce6190173",
    "c_6eef036f77",
  ]);
  expect(store.getRepo(drift.repo)?.latestRunId).toBe(second.id);
});
