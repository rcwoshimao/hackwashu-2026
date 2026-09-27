import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { basename, join, sep } from "node:path";
import {
  type Claim,
  type FlightPlan,
  flightPlanSchema,
} from "@ground-control/plan";
import { maxSavedPlanBytes } from "../../../config/limits.ts";
import { type SeedOptions, seedPlan } from "../../../ops/seed-plan.ts";
import {
  type RuntimeOutcome,
  type RuntimeStatus,
  runPlan,
} from "../../../packages/runner/src/index.ts";

export type LocalErrorCode =
  | "private_confirmation_required"
  | "checkout_invalid"
  | "plan_missing"
  | "plan_too_large"
  | "plan_invalid"
  | "plan_unreadable"
  | "no_local_docs"
  | "anthropic_key_required"
  | "gemini_key_required"
  | "invalid_extraction_model"
  | "scan_failed"
  | "run_failed";

export type LocalResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: LocalErrorCode } };

export type LocalClaimResult = {
  claimId: string;
  sourceId: string;
  kind: Claim["kind"];
  tier: Claim["tier"];
  occurrences: Claim["occurrences"];
  outcome: RuntimeOutcome;
};

export type LocalRun = {
  repo: string;
  checkout: string;
  sources: number;
  counts: Record<RuntimeStatus, number>;
  results: LocalClaimResult[];
};

function rootFor(checkout: string): LocalResult<string> {
  try {
    const root = realpathSync(checkout);
    return statSync(root).isDirectory()
      ? { ok: true, value: root }
      : { ok: false, error: { code: "checkout_invalid" } };
  } catch {
    return { ok: false, error: { code: "checkout_invalid" } };
  }
}

function localRepo(root: string): string {
  const slug = basename(root)
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, "-");
  const name = slug.replace(/-+/gu, "-").replace(/^-|-$/gu, "") || "checkout";
  const suffix = createHash("sha256").update(root).digest("hex").slice(0, 8);
  return `local/${name}-${suffix}`;
}

function readPlan(root: string): LocalResult<FlightPlan> {
  const path = join(root, "flightchecks", "flightplan.json");
  try {
    const actual = realpathSync(path);
    if (!actual.startsWith(`${root}${sep}`))
      return { ok: false, error: { code: "plan_unreadable" } };
    const details = statSync(actual);
    if (!details.isFile())
      return { ok: false, error: { code: "plan_unreadable" } };
    if (details.size > maxSavedPlanBytes)
      return { ok: false, error: { code: "plan_too_large" } };
    const parsed: unknown = JSON.parse(readFileSync(actual, "utf8"));
    const result = flightPlanSchema.safeParse(parsed);
    return result.success
      ? { ok: true, value: result.data }
      : { ok: false, error: { code: "plan_invalid" } };
  } catch (error) {
    const code =
      error instanceof Error && "code" in error && error.code === "ENOENT"
        ? "plan_missing"
        : error instanceof SyntaxError
          ? "plan_invalid"
          : "plan_unreadable";
    return { ok: false, error: { code } };
  }
}

function countsFor(
  results: readonly LocalClaimResult[],
): Record<RuntimeStatus, number> {
  const counts = { pass: 0, fail: 0, flaky: 0, skipped: 0, unverified: 0 };
  for (const result of results) counts[result.outcome.status] += 1;
  return counts;
}

function scanError(error: unknown): LocalErrorCode {
  const code = error instanceof Error ? error.message : "";
  if (code === "no_local_docs") return code;
  if (code === "anthropic_key_required") return code;
  if (code === "gemini_key_required") return code;
  if (code === "invalid_extraction_model") return code;
  return "scan_failed";
}

export async function rerunSavedChecks(
  checkout: string,
  privateExecution: boolean,
): Promise<LocalResult<LocalRun>> {
  if (!privateExecution)
    return { ok: false, error: { code: "private_confirmation_required" } };
  const resolved = rootFor(checkout);
  if (!resolved.ok) return resolved;
  const plan = readPlan(resolved.value);
  if (!plan.ok) return plan;
  try {
    const outcomes = await runPlan(plan.value, resolved.value);
    const results: LocalClaimResult[] = [];
    for (const claim of plan.value.claims) {
      const outcome = outcomes[claim.id];
      if (!outcome) return { ok: false, error: { code: "run_failed" } };
      results.push({
        claimId: claim.id,
        sourceId: claim.sourceId,
        kind: claim.kind,
        tier: claim.tier,
        occurrences: claim.occurrences,
        outcome,
      });
    }
    return {
      ok: true,
      value: {
        repo: plan.value.repo,
        checkout: resolved.value,
        sources: Object.keys(plan.value.sourceHashes).length,
        counts: countsFor(results),
        results,
      },
    };
  } catch {
    return { ok: false, error: { code: "run_failed" } };
  }
}

export async function scanLocalCheckout(
  checkout: string,
  privateExecution: boolean,
  options: SeedOptions = {},
): Promise<LocalResult<LocalRun>> {
  if (!privateExecution)
    return { ok: false, error: { code: "private_confirmation_required" } };
  const resolved = rootFor(checkout);
  if (!resolved.ok) return resolved;
  try {
    await seedPlan(resolved.value, localRepo(resolved.value), options);
  } catch (error) {
    return { ok: false, error: { code: scanError(error) } };
  }
  return rerunSavedChecks(resolved.value, true);
}
