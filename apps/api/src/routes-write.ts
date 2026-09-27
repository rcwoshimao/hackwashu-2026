import { timingSafeEqual } from "node:crypto";
import { commentOnConfirmedDrift } from "@ground-control/fixes";
import type { RunRecord } from "@ground-control/store";
import type { Context, Hono } from "hono";
import { z } from "zod";
import { accessRepo, sessionToken } from "./access.ts";
import { registerConnectRoute } from "./routes-connect.ts";
import { registerSourceWriteRoutes } from "./routes-sources.ts";
import { ingestTelemetry, refreshTrust, telemetrySchema } from "./telemetry.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail, repoSchema, requestBody, sha256 } from "./write-shared.ts";

async function publishStatus(
  deps: ApiDeps,
  run: RunRecord,
): Promise<boolean | null> {
  if (deps.status === undefined) return null;
  const posted = await deps.status.post(run);
  if (!posted)
    emit(deps, "status_publish_failed", { repo: run.repo, runId: run.id });
  return posted;
}

async function publishPrEvidence(deps: ApiDeps, run: RunRecord): Promise<void> {
  if (!run.pullRequestNumber || !deps.prComments) return;
  const comment = await commentOnConfirmedDrift(
    deps.store,
    run,
    run.pullRequestNumber,
    deps.publicUrl,
    deps.prComments,
  );
  if (!comment.ok)
    emit(deps, "pr_comment_failed", { repo: run.repo, runId: run.id });
}

async function refreshConnectedSources(
  deps: ApiDeps,
  repo: string,
): Promise<void> {
  const sync = deps.sourceSync;
  if (!sync) return;
  const ids = deps.store.listSources(repo).map((source) => source.id);
  let failed = 0;
  for (let index = 0; index < ids.length; index += 5) {
    const batch = ids.slice(index, index + 5);
    const results = await Promise.allSettled(
      batch.map((id) => sync.refresh(id)),
    );
    failed += results.filter(
      (item) =>
        item.status === "rejected" ||
        (item.status === "fulfilled" &&
          (!item.value.ok || item.value.value.status === "error")),
    ).length;
  }
  if (failed > 0) emit(deps, "source_refresh_failed", { repo, count: failed });
}

function queueSourceRefresh(deps: ApiDeps, repo: string): void {
  queueMicrotask(() => {
    void refreshConnectedSources(deps, repo).catch(() =>
      emit(deps, "source_refresh_failed", { repo }),
    );
  });
}

function tokenMatches(raw: string, hash: string | null): boolean {
  if (hash === null) return false;
  const stored = Buffer.from(hash, "hex");
  return stored.length === 32 && timingSafeEqual(sha256(raw), stored);
}

async function scan(c: Context, deps: ApiDeps) {
  const parsed = repoSchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  const known = deps.store.getRepo(parsed.data.repo);
  if (known?.visibility === "private")
    return fail(c, "private_scan_requires_connection", 403);
  if (deps.scanner === undefined) return fail(c, "scanner_unavailable", 503);
  const session = deps.auth.session(sessionToken(c.req.raw));
  const ip = deps.clientIp?.(c.req.raw) ?? "anonymous";
  if (
    session === null &&
    !deps.store.consumeScanQuota(ip, deps.now().getTime(), 5, 3_600_000)
  ) {
    return fail(c, "scan_rate_limited", 429);
  }
  try {
    const result = await deps.scanner.scan(parsed.data.repo);
    emit(deps, "scan", { repo: result.repo, state: result.state });
    return c.json(result, result.state === "queued" ? 202 : 200);
  } catch (error) {
    if (error instanceof Error && error.message === "not_public")
      return fail(c, "private_scan_requires_connection", 403);
    if (error instanceof Error && error.message === "no_markdown_readme")
      return fail(c, "no_markdown_readme", 400);
    if (error instanceof Error && error.message === "github_unavailable")
      return fail(c, "github_unavailable", 502);
    return fail(c, "scanner_unavailable", 503);
  }
}

async function trustAction(
  c: Context,
  deps: ApiDeps,
  state: "confirmed" | "dropped",
) {
  const run = deps.store.getRun(c.req.param("id") ?? "");
  if (run === null) return fail(c, "run_not_found", 404);
  const repo = deps.store.getRepo(run.repo);
  if (repo === null || !repo.connected)
    return fail(c, "repo_not_connected", 404);
  const allowed = await accessRepo(deps, c.req.raw, repo, true);
  if (!allowed.ok) return fail(c, "repo_access_denied", allowed.status);
  const claimId = c.req.param("claimId") ?? "";
  if (!run.results.some((item) => item.claimId === claimId))
    return fail(c, "claim_not_found", 404);
  const latest = refreshTrust(deps.store, repo.repo, claimId, state);
  const statusPosted =
    latest === null ? null : await publishStatus(deps, latest);
  if (latest) await publishPrEvidence(deps, latest);
  emit(deps, "trust_changed", { repo: repo.repo, claimId, state });
  return c.json({
    claimId,
    state,
    latestVerdict: latest?.verdict ?? null,
    statusPosted,
  });
}

async function telemetry(c: Context, deps: ApiDeps) {
  const parsed = telemetrySchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  const repo = deps.store.getRepo(parsed.data.repo);
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (
    repo === null ||
    !repo.connected ||
    !tokenMatches(token, repo.tokenHash)
  ) {
    return fail(c, "telemetry_unauthorized", 401);
  }
  if (repo.visibility !== "private")
    return fail(c, "private_repository_required", 403);
  const run = ingestTelemetry(deps.store, parsed.data, deps.now());
  const statusPosted = await publishStatus(deps, run);
  if (parsed.data.docsChanged === true && !parsed.data.pullRequestNumber)
    queueSourceRefresh(deps, repo.repo);
  await publishPrEvidence(deps, run);
  if (statusPosted === true && deps.messaging?.confirmCorrection) {
    const verified = await deps.messaging.confirmCorrection(run);
    if (!verified.ok)
      emit(deps, "correction_message_failed", {
        repo: repo.repo,
        runId: run.id,
      });
  }
  if (parsed.data.authorLogin && deps.messaging) {
    const alerted = await deps.messaging.alert(
      run,
      parsed.data.authorLogin,
      parsed.data.codeChanged === true,
    );
    if (!alerted.ok)
      emit(deps, "message_failed", { repo: repo.repo, runId: run.id });
  }
  emit(deps, "run", { repo: repo.repo, runId: run.id, verdict: run.verdict });
  return c.json(
    {
      id: run.id,
      verdict: run.verdict,
      results: run.results.length,
      statusPosted,
    },
    201,
  );
}

const imessageLinkSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
});

async function imessageLink(c: Context, deps: ApiDeps) {
  const session = deps.auth.session(sessionToken(c.req.raw));
  if (session === null) return fail(c, "sign_in_required", 401);
  const parsed = imessageLinkSchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  if (!deps.messaging?.requestLink) return fail(c, "imessage_unavailable", 503);
  const key = `imessage_link:${session.login.toLowerCase()}`;
  if (!deps.store.consumeScanQuota(key, deps.now().getTime(), 3, 3_600_000))
    return fail(c, "link_rate_limited", 429);
  const link = await deps.messaging.requestLink(
    session.login,
    parsed.data.phone,
  );
  if (!link.ok) return fail(c, "imessage_unavailable", 503);
  return c.json({ status: "sent" }, 201);
}

export function registerWriteRoutes(app: Hono, deps: ApiDeps): void {
  app.post("/api/scan", (c) => scan(c, deps));
  registerConnectRoute(app, deps);
  registerSourceWriteRoutes(app, deps);
  app.post("/api/runs/:id/claims/:claimId/confirm", (c) =>
    trustAction(c, deps, "confirmed"),
  );
  app.post("/api/runs/:id/claims/:claimId/drop", (c) =>
    trustAction(c, deps, "dropped"),
  );
  app.post("/api/telemetry", (c) => telemetry(c, deps));
  app.post("/api/imessage/link", (c) => imessageLink(c, deps));
}
