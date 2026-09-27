import type { Hono } from "hono";
import { sessionToken } from "./access.ts";
import type { ApiDeps } from "./types.ts";

function cookie(token: string, secure: boolean, age: number): string {
  const parts = [
    `gc_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${age}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function redirect(url: string, cookieValue?: string): Response {
  const headers = new Headers({ Location: url, "Cache-Control": "no-store" });
  if (cookieValue !== undefined) headers.set("Set-Cookie", cookieValue);
  return new Response(null, { status: 302, headers });
}

export function registerAuthRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/auth/github", (c) => {
    const result = deps.auth.begin("web");
    return result.ok
      ? redirect(result.value)
      : c.json({ error: result.error.code }, 503);
  });

  app.get("/auth/github/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    if (!code || !state) return c.json({ error: "invalid_callback" }, 400);
    const result = await deps.auth.complete(code, state);
    if (!result.ok) return c.json({ error: result.error.code }, 400);
    return redirect(
      result.value.redirect,
      cookie(
        result.value.token,
        deps.publicUrl.startsWith("https:"),
        7 * 24 * 60 * 60,
      ),
    );
  });

  app.post("/auth/signout", (c) => {
    deps.auth.sessions.remove(sessionToken(c.req.raw));
    return new Response(JSON.stringify({ signedIn: false }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Set-Cookie": cookie("", deps.publicUrl.startsWith("https:"), 0),
      },
    });
  });
}
