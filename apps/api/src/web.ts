import { isAbsolute, relative, resolve } from "node:path";
import type { Hono } from "hono";

function inside(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return (
    path !== ".." &&
    !path.startsWith(`..\\`) &&
    !path.startsWith("../") &&
    !isAbsolute(path)
  );
}

function spaPath(path: string): boolean {
  return (
    path === "/" ||
    path === "/sky" ||
    path === "/connect" ||
    path === "/signin" ||
    path === "/sources/new" ||
    /^\/repos\/[^/]+\/[^/]+$/.test(path) ||
    /^\/runs\/[^/]+$/.test(path)
  );
}

async function fileResponse(
  path: string,
  immutable: boolean,
): Promise<Response> {
  const file = Bun.file(path);
  if (!(await file.exists())) return new Response("Not Found", { status: 404 });
  return new Response(file, {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": immutable
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    },
  });
}

export function registerWebRoutes(app: Hono, dist: string): void {
  const root = resolve(dist);
  app.get("/assets/*", async (c) => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(c.req.url).pathname).slice(1);
    } catch {
      return new Response("Not Found", { status: 404 });
    }
    if (path.includes("\\") || path.includes("\0"))
      return new Response("Not Found", { status: 404 });
    const candidate = resolve(root, path);
    if (!inside(root, candidate))
      return new Response("Not Found", { status: 404 });
    return fileResponse(candidate, true);
  });
  app.get("*", (c) => {
    const path = new URL(c.req.url).pathname;
    if (!spaPath(path)) return new Response("Not Found", { status: 404 });
    return fileResponse(resolve(root, "index.html"), false);
  });
}
