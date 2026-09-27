import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type FlightPlan,
  flightPlanSchema,
} from "../../packages/plan/src/schema.ts";
import type { RuntimeOutcome } from "../../packages/runner/src/runtime-types.ts";
import { matchingRunRepository } from "./git-context.ts";
import type {
  ChangeMetadata,
  FlightRunner,
  Telemetry,
  TelemetryResult,
} from "./types.ts";

function readPlan(root: string, repo: string): FlightPlan {
  const content = readFileSync(
    join(root, "flightchecks/flightplan.json"),
    "utf8",
  );
  const parsed = flightPlanSchema.safeParse(JSON.parse(content) as unknown);
  if (!parsed.success) throw new TypeError("Flight plan is invalid");
  if (parsed.data.repo !== repo)
    throw new TypeError("Flight plan repository does not match checkout");
  return parsed.data;
}

function deepLink(
  repo: string,
  sha: string,
  claim: FlightPlan["claims"][number],
): string | null {
  const location = claim.occurrences[0]?.location;
  if (
    location?.kind !== "file" ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo)
  )
    return null;
  const path = location.path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repo}/blob/${sha}/${path}#L${location.lineStart}`;
}

function resultFor(
  claim: FlightPlan["claims"][number],
  outcome: RuntimeOutcome,
  repo: string,
  sha: string,
): TelemetryResult {
  const quote = claim.occurrences[0]?.quote;
  if (!quote) throw new TypeError(`Claim ${claim.id} lacks an occurrence`);
  return {
    kind: claim.kind,
    params: claim.params,
    claimId: claim.id,
    sourceId: claim.sourceId,
    quote,
    status: outcome.status,
    expected: outcome.expected,
    actual: outcome.actual.split(/\r?\n/u).slice(0, 20).join("\n"),
    deepLink: deepLink(repo, sha, claim),
  };
}

export async function loadRunner(root: string): Promise<FlightRunner> {
  const path = pathToFileURL(join(root, "flightchecks/runner.mjs")).href;
  const module: unknown = await import(path);
  if (
    typeof module !== "object" ||
    module === null ||
    !("runPlan" in module) ||
    typeof module.runPlan !== "function"
  ) {
    throw new TypeError("Bundled runner does not export runPlan");
  }
  return module.runPlan as FlightRunner;
}

export async function loadConnectedRunner(
  root: string,
  event: unknown,
  repo: string | undefined,
): Promise<
  | { ok: true; value: FlightRunner }
  | { ok: false; error: { code: "repository_identity_required" } }
> {
  if (!repo || !matchingRunRepository(event, repo))
    return { ok: false, error: { code: "repository_identity_required" } };
  readPlan(root, repo);
  return { ok: true, value: await loadRunner(root) };
}

export async function runFlightChecks(
  root: string,
  repo: string,
  commitSha: string,
  runner: FlightRunner,
  metadata: ChangeMetadata = {},
): Promise<Telemetry> {
  const plan = readPlan(root, repo);
  const results = await runner(plan, root);
  const telemetry: Telemetry = {
    repo,
    commitSha,
    ...metadata,
    results: plan.claims.map((claim) => {
      const outcome = results[claim.id];
      if (!outcome)
        throw new Error(`Runner returned no result for ${claim.id}`);
      return resultFor(claim, outcome, repo, commitSha);
    }),
  };
  const output = join(root, ".groundcontrol");
  mkdirSync(output, { recursive: true });
  writeFileSync(
    join(output, "telemetry.json"),
    `${JSON.stringify(telemetry, null, 2)}\n`,
  );
  return telemetry;
}
