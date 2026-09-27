import type { Hono } from "hono";
import { sessionToken } from "./access.ts";
import type { ApiDeps } from "./types.ts";

export function registerAccountRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/api/account/repos", async (c) => {
    const session = deps.auth.session(sessionToken(c.req.raw));
    if (session === null)
      return c.json({ error: "sign_in_required" }, 401);
    const listed = await deps.auth.repositories(session);
    if (!listed.ok)
      return c.json({ error: "github_unavailable" }, 502);
    c.header("Cache-Control", "private, no-store");
    return c.json({
      repos: listed.value.repos.map((item) => {
        const stored = deps.store.getRepo(item.repo);
        return {
          ...item,
          connected:
            stored?.connected === true &&
            stored.visibility === item.visibility,
          scanned:
            item.visibility === "public" &&
            stored?.visibility === "public" &&
            deps.store.getSatellite(item.repo) !== null,
        };
      }),
      truncated: listed.value.truncated,
    });
  });
}
