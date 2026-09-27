import type { Context, Hono } from "hono";
import { z } from "zod";
import { accessRepo } from "./access.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail, requestBody } from "./write-shared.ts";

const installSchema = z.object({
  branch: z.string().trim().min(1).max(100),
});

async function installWorkflow(c: Context, deps: ApiDeps) {
  const repo = `${c.req.param("owner")}/${c.req.param("repo")}`;
  const connected = deps.store.getRepo(repo);
  if (!connected?.connected || connected.runtimeEnabled !== true)
    return fail(c, "deep_scan_not_enabled", 404);
  const access = await accessRepo(deps, c.req.raw, connected, true);
  if (!access.ok) return fail(c, "repo_access_denied", access.status);
  const parsed = installSchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  if (!deps.workflowInstall)
    return fail(c, "workflow_install_unavailable", 503);
  const result = await deps.workflowInstall.install(
    repo,
    parsed.data.branch,
    deps.publicUrl,
  );
  if (!result.ok)
    return fail(
      c,
      result.reason,
      result.reason === "setup_incomplete" ? 409 : 502,
    );
  emit(deps, "workflow_install_finished", {
    repo,
    created: result.created,
  });
  return c.json({ created: result.created }, result.created ? 201 : 200);
}

export function registerWorkflowInstallRoute(app: Hono, deps: ApiDeps): void {
  app.post("/api/repos/:owner/:repo/workflow", (c) => installWorkflow(c, deps));
}
