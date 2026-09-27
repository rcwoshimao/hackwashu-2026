import type { AuthSession } from "@ground-control/auth";
import type { RepoRecord } from "@ground-control/store";
import type { ApiDeps } from "./types.ts";

type AccessResult =
  | { ok: true; session: AuthSession | null }
  | { ok: false; status: 401 | 403 | 502 };

export function sessionToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("gc_session="));
  return cookie?.slice("gc_session=".length);
}

export async function accessRepo(
  deps: ApiDeps,
  request: Request,
  repo: RepoRecord,
  write = false,
): Promise<AccessResult> {
  if (!write && repo.visibility === "public")
    return { ok: true, session: null };
  const session = deps.auth.session(sessionToken(request));
  if (session === null) return { ok: false, status: 401 };
  const permission = await deps.auth.access(session, repo.repo);
  if (!permission.ok) return { ok: false, status: 502 };
  if (
    repo.visibility === "private" &&
    permission.value.visibility !== "private"
  )
    return { ok: false, status: 403 };
  if (write ? !permission.value.canAdmin : !permission.value.canRead) {
    return { ok: false, status: 403 };
  }
  return { ok: true, session };
}
