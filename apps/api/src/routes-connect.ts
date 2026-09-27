import { randomBytes } from "node:crypto";
import type { RepoRecord } from "@ground-control/store";
import type { Context, Hono } from "hono";
import { sessionToken } from "./access.ts";
import type { ApiDeps } from "./types.ts";
import { emit, fail, repoSchema, requestBody, sha256 } from "./write-shared.ts";

function connectedRepo(
  repo: string,
  visibility: RepoRecord["visibility"],
): RepoRecord {
  return {
    repo,
    visibility,
    connected: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  };
}

type Connection =
  | { repo: string; visibility: "public" }
  | { repo: string; visibility: "private"; telemetryToken: string };

function connectionFor(
  repo: string,
  visibility: RepoRecord["visibility"],
): Connection {
  return visibility === "private"
    ? {
        repo,
        visibility,
        telemetryToken: randomBytes(32).toString("base64url"),
      }
    : { repo, visibility };
}

function queueRefresh(
  deps: ApiDeps,
  repo: string,
  ids: readonly string[],
  oauthToken: string,
): void {
  const sync = deps.sourceSync;
  if (!sync) return;
  void Promise.allSettled(
    ids.slice(0, 20).map((id) => sync.refresh(id, oauthToken)),
  ).then((outcomes) => {
    const failed = outcomes.filter((item) => item.status === "rejected").length;
    if (failed > 0)
      emit(deps, "source_refresh_failed", { repo, count: failed });
  });
}

async function discoverSources(
  deps: ApiDeps,
  repo: string,
  oauthToken: string,
) {
  const sync = deps.sourceSync;
  if (!sync) return { status: "unavailable", registered: 0 };
  const found = await sync.discover(repo, oauthToken);
  if (!found.ok)
    return { status: "error", registered: 0, errorCode: found.error.code };
  emit(deps, "source_discovered", { repo, count: found.value.length });
  queueRefresh(
    deps,
    repo,
    found.value.map((source) => source.id),
    oauthToken,
  );
  return { status: "queued", registered: found.value.length };
}

async function discoveryResponse(
  c: Context,
  deps: ApiDeps,
  connection: Connection,
  oauthToken: string,
) {
  const sourceDiscovery = await discoverSources(
    deps,
    connection.repo,
    oauthToken,
  );
  return c.json({ ...connection, sourceDiscovery }, 201);
}

async function connect(c: Context, deps: ApiDeps) {
  const parsed = repoSchema.safeParse(await requestBody(c.req.raw));
  if (!parsed.success) return fail(c, "invalid_request", 400);
  const session = deps.auth.session(sessionToken(c.req.raw));
  if (session === null) return fail(c, "sign_in_required", 401);
  const access = await deps.auth.access(session, parsed.data.repo);
  if (!access.ok) return fail(c, "github_unavailable", 502);
  if (!access.value.canAdmin) return fail(c, "admin_access_required", 403);
  const old = deps.store.getRepo(parsed.data.repo);
  if (old?.visibility === "private" && access.value.visibility === "public") {
    deps.store.putRepo({ ...old, tokenHash: null });
    return fail(c, "repository_visibility_changed", 409);
  }
  const connection = connectionFor(parsed.data.repo, access.value.visibility);
  deps.store.putRepo({
    ...(old ?? connectedRepo(parsed.data.repo, access.value.visibility)),
    visibility: access.value.visibility,
    connected: true,
    tokenHash:
      connection.visibility === "private"
        ? sha256(connection.telemetryToken).toString("hex")
        : null,
  });
  emit(deps, "repo_connected", { repo: parsed.data.repo });
  return discoveryResponse(c, deps, connection, session.oauthToken);
}

export function registerConnectRoute(app: Hono, deps: ApiDeps): void {
  app.post("/api/connect", (c) => connect(c, deps));
}
