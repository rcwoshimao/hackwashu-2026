import type { Context, Hono } from "hono";
import { accessRepo } from "./access.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail } from "./write-shared.ts";

async function createSmokePr(c: Context, deps: ApiDeps) {
  const repo = `${c.req.param("owner")}/${c.req.param("repo")}`;
  const connected = deps.store.getRepo(repo);
  if (!connected?.connected || connected.runtimeEnabled !== true)
    return fail(c, "deep_scan_not_enabled", 404);
  const access = await accessRepo(deps, c.req.raw, connected, true);
  if (!access.ok) return fail(c, "repo_access_denied", access.status);
  if (!deps.smokePr) return fail(c, "draft_pr_unavailable", 503);
  const created = await deps.smokePr.create(repo);
  if (!created.ok)
    return fail(
      c,
      created.reason,
      created.reason === "setup_incomplete" ? 409 : 502,
    );
  emit(deps, "smoke_pr_created", { repo, url: created.url });
  return c.json({ url: created.url }, 201);
}

export function registerSmokePrRoute(app: Hono, deps: ApiDeps): void {
  app.post("/api/repos/:owner/:repo/smoke-pr", (c) => createSmokePr(c, deps));
}
