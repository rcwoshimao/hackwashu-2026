import { fileURLToPath } from "node:url";
import { type FlightPlan, planToTests } from "@ground-control/plan";
import type { AppStore } from "@ground-control/store";

export type FileUpdate = { path: string; content: string };
export type PublishResult =
  | { ok: true; value: { state: "published" | "unchanged"; commitSha: string } }
  | {
      ok: false;
      error: {
        code:
          | "not_connected"
          | "private_repository_required"
          | "github_failed"
          | "bundle_failed";
      };
    };

export interface PlanWritePort {
  publish(repo: string, files: readonly FileUpdate[]): Promise<PublishResult>;
}

async function runnerBundle(): Promise<string | null> {
  const result = await Bun.build({
    entrypoints: [
      fileURLToPath(new URL("../../runner/src/embedded.ts", import.meta.url)),
    ],
    target: "node",
    format: "esm",
  });
  const output = result.outputs[0];
  return result.success && output
    ? `// Ground Control 0.1.0; generated from packages/runner.\n${await output.text()}`
    : null;
}

export async function publishFlightPlan(
  store: AppStore,
  repo: string,
  writer: PlanWritePort,
): Promise<PublishResult> {
  const record = store.getRepo(repo);
  if (record?.connected !== true)
    return { ok: false, error: { code: "not_connected" } };
  if (record.visibility !== "private")
    return { ok: false, error: { code: "private_repository_required" } };
  const plan = store.getFlightPlan(repo);
  if (!plan) return { ok: false, error: { code: "bundle_failed" } };
  const filtered: FlightPlan = {
    ...plan,
    claims: plan.claims.filter(
      (claim) => store.getTrust(repo, claim.id) !== "dropped",
    ),
  };
  const runner = await runnerBundle();
  if (!runner) return { ok: false, error: { code: "bundle_failed" } };
  return writer.publish(repo, [
    {
      path: "flightchecks/flightplan.json",
      content: `${JSON.stringify(filtered, null, 2)}\n`,
    },
    { path: "flightchecks/flight.test.mjs", content: planToTests(filtered) },
    { path: "flightchecks/runner.mjs", content: runner },
  ]);
}

export { FakePlanWriter, OctokitPlanWriter } from "./octokit.ts";
