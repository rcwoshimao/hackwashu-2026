import type { Context, Hono } from "hono";
import {
  deepFixRateLimitPerHour,
  deepFixRateWindowMs,
} from "../../../config/limits.ts";
import { accessRepo } from "./access.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail } from "./write-shared.ts";

async function fixClaim(c: Context, deps: ApiDeps) {
  const run = deps.store.getRun(c.req.param("id") ?? "");
  if (run?.origin !== "ci") return fail(c, "deep_run_not_found", 404);
  const repo = deps.store.getRepo(run.repo);
  if (!repo?.connected || repo.runtimeEnabled !== true)
    return fail(c, "deep_scan_not_enabled", 404);
  const allowed = await accessRepo(deps, c.req.raw, repo, true);
  if (!allowed.ok) return fail(c, "repo_access_denied", allowed.status);
  if (!allowed.session) return fail(c, "sign_in_required", 401);
  const claimId = c.req.param("claimId") ?? "";
  if (
    !run.results.some(
      (item) =>
        item.claimId === claimId &&
        item.state === "confirmed" &&
        item.status === "fail",
    )
  )
    return fail(c, "confirmed_finding_not_found", 404);
  const latestCi = deps.store
    .listRuns(run.repo)
    .find((item) => item.origin === "ci");
  if (latestCi?.id !== run.id) return fail(c, "run_is_not_latest", 409);
  if (!deps.deepFix) return fail(c, "deep_fix_unavailable", 503);
  const key = `deep_fix:${run.repo}:${run.id}:${claimId}:${allowed.session.login}`;
  if (
    !deps.store.consumeScanQuota(
      key,
      deps.now().getTime(),
      deepFixRateLimitPerHour,
      deepFixRateWindowMs,
    )
  )
    return fail(c, "deep_fix_rate_limited", 429);
  const result = await deps.deepFix.fix(
    run,
    [claimId],
    allowed.session.oauthToken,
  );
  if (!result.ok)
    return fail(c, result.reason, result.reason === "no_fix" ? 409 : 502);
  emit(deps, "deep_fix_opened", {
    repo: run.repo,
    runId: run.id,
    claimId,
    url: result.url,
  });
  return c.json({ url: result.url, fixedClaimIds: result.fixedClaimIds }, 201);
}

export function registerDeepFixRoute(app: Hono, deps: ApiDeps): void {
  app.post("/api/runs/:id/claims/:claimId/fix", (c) => fixClaim(c, deps));
}
