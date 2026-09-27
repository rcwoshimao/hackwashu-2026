import { resolveSource, sourceStatus } from "@ground-control/source-sync";
import type { SourceRecord } from "@ground-control/store";
import type { Context, Hono } from "hono";
import { z } from "zod";
import { accessRepo } from "./access.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail, repoSchema, requestBody, sha256 } from "./write-shared.ts";

const sourceSchema = repoSchema.extend({
  kind: z.enum(["readme", "docs", "wiki", "man", "confluence", "url"]),
  url: z.url().refine((value) => new URL(value).protocol === "https:"),
});

function newSource(
  repo: string,
  kind: SourceRecord["kind"],
  url: string,
): SourceRecord {
  return {
    id: `src_${sha256(`${repo}\n${url}`).toString("hex").slice(0, 16)}`,
    repo,
    kind,
    title: new URL(url).hostname,
    url,
    claimCount: 0,
  };
}

async function addSource(c: Context, deps: ApiDeps) {
  const parsed = sourceSchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  const repo = deps.store.getRepo(parsed.data.repo);
  if (!repo?.connected) return fail(c, "repo_not_connected", 404);
  const allowed = await accessRepo(deps, c.req.raw, repo, true);
  if (!allowed.ok) return fail(c, "repo_access_denied", allowed.status);
  if (!deps.sourceSync) return fail(c, "source_sync_unavailable", 503);
  const source = newSource(repo.repo, parsed.data.kind, parsed.data.url);
  const existing = deps.store.getSource(source.id);
  if (existing)
    return c.json({
      ...existing,
      sync: sourceStatus(deps.store.getSourceSnapshot(existing.id)),
    });
  const resolved = resolveSource(source, deps.confluenceSite);
  if (!resolved.ok && resolved.error.code !== "unconfigured")
    return fail(c, "invalid_source_url", 400);
  deps.store.putSource(source);
  emit(deps, "source_added", { repo: repo.repo, sourceId: source.id });
  const refreshed = await deps.sourceSync.refresh(
    source.id,
    allowed.session?.oauthToken,
    { waitForPlan: false },
  );
  const sync = refreshed.ok
    ? refreshed.value
    : sourceStatus(deps.store.getSourceSnapshot(source.id));
  return c.json({ ...source, sync }, 201);
}

async function refreshSource(c: Context, deps: ApiDeps) {
  const source = deps.store.getSource(c.req.param("id") ?? "");
  if (!source) return fail(c, "source_not_found", 404);
  const repo = deps.store.getRepo(source.repo);
  if (!repo?.connected) return fail(c, "repo_not_connected", 404);
  const allowed = await accessRepo(deps, c.req.raw, repo, true);
  if (!allowed.ok) return fail(c, "repo_access_denied", allowed.status);
  if (!deps.sourceSync) return fail(c, "source_sync_unavailable", 503);
  const refreshed = await deps.sourceSync.refresh(
    source.id,
    allowed.session?.oauthToken,
    { waitForPlan: false },
  );
  return refreshed.ok
    ? c.json(refreshed.value)
    : fail(c, "source_not_found", 404);
}

export function registerSourceWriteRoutes(app: Hono, deps: ApiDeps): void {
  app.post("/api/sources", (c) => addSource(c, deps));
  app.post("/api/sources/:id/refresh", (c) => refreshSource(c, deps));
}
