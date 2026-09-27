import { sourceStatus } from "@ground-control/source-sync";
import type {
  AppStore,
  RepoRecord,
  RunRecord,
  SourceRecord,
} from "@ground-control/store";
import type { Hono } from "hono";
import { accessRepo, sessionToken } from "./access.ts";
import { eventStream } from "./events.ts";
import type { ApiDeps } from "./types.ts";

function error(code: string, status: 401 | 403 | 404 | 502) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function sky(store: AppStore, now: Date, demo: boolean) {
  const available = store
    .listSatellites()
    .filter(
      (item) =>
        item.simulated || store.getRepo(item.repo)?.visibility !== "private",
    );
  const real = available.filter((item) => !item.simulated);
  const satellites = demo && real.length === 0 ? available : real;
  return {
    mode:
      satellites.length === 0
        ? "empty"
        : real.length === 0
          ? "simulated"
          : store.getSkyMode() === "cached"
            ? "cached"
            : "live",
    updatedAt: now.toISOString(),
    satellites,
    findings: {
      realCount: real.length,
      driftingCount: real.filter((item) => item.label === "Drifting").length,
      medianLagDays: median(real.map((item) => item.readmeLagDays)),
    },
  };
}

function publicScan(store: AppStore, repo: RepoRecord) {
  if (repo.visibility !== "public") return null;
  const satellite = store.getSatellite(repo.repo);
  if (!satellite || satellite.simulated) return null;
  return {
    commitSha: satellite.commitSha,
    scannedAt: satellite.scannedAt,
    tiersRun: satellite.tiersRun,
  };
}

function uniqueSources(sources: readonly SourceRecord[]): SourceRecord[] {
  const chosen = new Map<string, SourceRecord>();
  for (const source of sources) {
    const key =
      source.kind === "readme" ||
      source.kind === "docs" ||
      source.kind === "man"
        ? `${source.kind}:${source.title}`
        : `${source.kind}:${source.url}`;
    const prior = chosen.get(key);
    if (!prior || source.claimCount > prior.claimCount) chosen.set(key, source);
  }
  return [...chosen.values()];
}

function runSummary(run: RunRecord) {
  return {
    id: run.id,
    commitSha: run.commitSha,
    createdAt: run.createdAt,
    verdict: run.verdict,
    origin: run.origin ?? "unknown",
    failingCount: run.results.filter(
      (item) => item.state === "confirmed" && item.status === "fail",
    ).length,
    reviewCount: run.results.filter(
      (item) =>
        item.status === "fail" &&
        (item.state === "disputed" || item.state === "unconfirmed"),
    ).length,
  };
}

function repoView(
  store: AppStore,
  repo: RepoRecord,
  sources: readonly SourceRecord[],
  runs: readonly RunRecord[],
) {
  const latestCi = runs.find((run) => run.origin === "ci");
  return {
    repo: repo.repo,
    visibility: repo.visibility,
    runtimeEnabled:
      repo.visibility === "private" || repo.runtimeEnabled === true,
    label: repo.label,
    driftDegrees: repo.driftDegrees,
    latestRunId: repo.latestRunId,
    recentRunsClearedAt: repo.recentRunsClearedAt,
    latestCiRun: latestCi ? runSummary(latestCi) : null,
    scan: publicScan(store, repo),
    sources: uniqueSources(sources).map(
      ({ id, kind, title, url, claimCount }) => ({
        id,
        kind,
        title,
        url,
        claimCount,
        sync: sourceStatus(store.getSourceSnapshot(id)),
      }),
    ),
    runs: runs
      .filter(
        (run) =>
          !repo.recentRunsClearedAt || run.createdAt > repo.recentRunsClearedAt,
      )
      .map(runSummary),
  };
}

function registerRepoReadRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/api/repos/:owner/:name", async (c) => {
    const name = `${c.req.param("owner")}/${c.req.param("name")}`;
    const repo = deps.store.getRepo(name);
    if (repo === null) return error("repo_not_found", 404);
    const allowed = await accessRepo(deps, c.req.raw, repo);
    if (!allowed.ok) return error("repo_access_denied", allowed.status);
    return c.json(
      repoView(
        deps.store,
        repo,
        deps.store.listSources(name),
        deps.store.listRuns(name),
      ),
    );
  });

  app.get("/api/runs/:id", async (c) => {
    const run = deps.store.getRun(c.req.param("id"));
    if (run === null) return error("run_not_found", 404);
    const repo = deps.store.getRepo(run.repo);
    if (repo === null) return error("repo_not_found", 404);
    const allowed = await accessRepo(deps, c.req.raw, repo);
    if (!allowed.ok) return error("repo_access_denied", allowed.status);
    const fixes: Record<string, string> = {};
    for (const result of run.results) {
      const fix = deps.store.getClaimFix(run.repo, result.claimId);
      if (fix) fixes[result.claimId] = fix.pullRequestUrl;
    }
    return c.json({ ...run, fixes, fixAvailable: deps.scanFix !== undefined });
  });

  app.get("/api/sources/:id/status", async (c) => {
    const source = deps.store.getSource(c.req.param("id"));
    if (source === null) return error("source_not_found", 404);
    const repo = deps.store.getRepo(source.repo);
    if (repo === null) return error("repo_not_found", 404);
    const allowed = await accessRepo(deps, c.req.raw, repo);
    if (!allowed.ok) return error("repo_access_denied", allowed.status);
    return c.json(sourceStatus(deps.store.getSourceSnapshot(source.id)));
  });
}

function registerOtherReadRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/api/me", async (c) => {
    const session = deps.auth.session(sessionToken(c.req.raw));
    if (session === null)
      return c.json({ signedIn: false, connectedRepos: [] });
    const connectedRepos: string[] = [];
    for (const repo of deps.store
      .listRepos()
      .filter((item) => item.connected)) {
      const allowed = await accessRepo(deps, c.req.raw, repo);
      if (allowed.ok) connectedRepos.push(repo.repo);
    }
    return c.json({ signedIn: true, login: session.login, connectedRepos });
  });
}

export function registerReadRoutes(app: Hono, deps: ApiDeps): void {
  app.get("/healthz", (c) => c.text("ok"));
  app.get("/api/sky", (c) =>
    c.json(sky(deps.store, deps.now(), c.req.query("demo") === "1")),
  );
  app.get("/api/events", (c) => eventStream(deps, c.req.raw));
  registerRepoReadRoutes(app, deps);
  registerOtherReadRoutes(app, deps);
}
