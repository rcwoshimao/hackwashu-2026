import type { Hono } from "hono";
import { sessionToken } from "./access.ts";
import type { ApiDeps } from "./types.ts";

export function registerAccountRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/api/account/repos", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const session = deps.auth.session(sessionToken(c.req.raw));
    if (session === null) return c.json({ error: "sign_in_required" }, 401);
    const listed = await deps.auth.repositories(session);
    if (!listed.ok) return c.json({ error: "github_unavailable" }, 502);
    return c.json({
      repos: listed.value.repos.map((item) => {
        const stored = deps.store.getRepo(item.repo);
        const current = stored?.visibility === item.visibility ? stored : null;
        return {
          ...item,
          connected: current?.connected === true,
          runtimeEnabled: current?.runtimeEnabled === true,
          checked:
            current?.latestRunId !== null && current?.latestRunId !== undefined,
          label: current?.latestRunId ? current.label : null,
          scanned:
            item.visibility === "public" &&
            current !== null &&
            deps.store.getSatellite(item.repo) !== null,
        };
      }),
      truncated: listed.value.truncated,
    });
  });
}
