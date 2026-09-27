import { createHash } from "node:crypto";
import {
  extractFlightPlan,
  type ModelCache,
  type ModelPort,
} from "@ground-control/ai";
import type { Claim } from "@ground-control/plan";
import { markdownToDocText } from "@ground-control/sources";
import type {
  AppStore,
  EventRecord,
  RunRecord,
  SatelliteRecord,
} from "@ground-control/store";
import {
  driftDegrees,
  evidenceFor,
  labelFor,
  runClaims,
} from "./assessment.ts";
import type { PublicGitHubPort, PublicRepo } from "./github.ts";
import { starRanking } from "./ranking.ts";

export type ScanResult =
  | { state: "queued"; repo: string }
  | { state: "cached"; repo: string; commitSha: string };

function daysBetween(later: string, earlier: string): number {
  const difference = Date.parse(later) - Date.parse(earlier);
  return Number.isFinite(difference)
    ? Math.max(0, Math.floor(difference / 86_400_000))
    : 0;
}

function topicCluster(
  topics: readonly string[],
  language: string | null,
): string {
  const labels = topics.join(" ").toLowerCase();
  if (/react|vue|svelte|ui|frontend|component/.test(labels))
    return "UI libraries";
  if (/webpack|vite|rollup|build|bundl/.test(labels)) return "Build tools";
  if (/express|server|api|backend|database/.test(labels)) return "Back end";
  if (/framework|nextjs|nuxt/.test(labels)) return "Frameworks";
  return language === "TypeScript" ? "TypeScript" : "Other";
}

function runId(repo: string, sha: string): string {
  return `run_${createHash("sha256").update(`${repo}\n${sha}`).digest("hex").slice(0, 20)}`;
}

function requirePublicRecord(store: AppStore, repo: string): void {
  if (store.getRepo(repo)?.visibility === "private")
    throw new Error("private_connection_requires_refresh");
}

function savePublicRecord(
  store: AppStore,
  repo: string,
  label: string,
  driftDegrees: number,
  latestRunId: string,
): void {
  requirePublicRecord(store, repo);
  const prior = store.getRepo(repo);
  const hasCiResult =
    prior?.runtimeEnabled === true &&
    prior.latestRunId !== null &&
    prior.latestRunId !== undefined &&
    store.getRun(prior.latestRunId)?.origin === "ci";
  store.putRepo({
    repo,
    visibility: "public",
    connected: prior?.connected ?? false,
    tokenHash: prior?.tokenHash ?? null,
    ...(prior?.runtimeEnabled === true ? { runtimeEnabled: true } : {}),
    label: hasCiResult ? prior.label : label,
    driftDegrees: hasCiResult ? prior.driftDegrees : driftDegrees,
    latestRunId: hasCiResult ? prior.latestRunId : latestRunId,
  });
}

function cachedAtDesiredTier(
  cached: SatelliteRecord | null,
  sha: string,
  model: ModelPort,
): boolean {
  return (
    cached !== null &&
    !cached.simulated &&
    cached.commitSha === sha &&
    (model.model === "local-static" || cached.tiersRun.includes("ai"))
  );
}

function reusePublicScan(
  store: AppStore,
  repo: PublicRepo,
  model: ModelPort,
): boolean {
  const cached = store.getSatellite(repo.repo);
  if (!cached || !cachedAtDesiredTier(cached, repo.sha, model)) return false;
  const run = store.getRun(runId(repo.repo, repo.sha));
  if (!run || run.repo !== repo.repo || run.commitSha !== repo.sha)
    return false;
  // Relabel from the saved results so a changed labelling rule applies to
  // cached scans without another GitHub or model call.
  const label = labelFor(run.results);
  const degrees = driftDegrees(run.results);
  if (label !== cached.label || degrees !== cached.driftDegrees)
    store.putSatellite({ ...cached, label, driftDegrees: degrees });
  savePublicRecord(store, repo.repo, label, degrees, run.id);
  return true;
}

async function pathFacts(
  github: PublicGitHubPort,
  repo: PublicRepo,
  claims: readonly Claim[],
): Promise<ReadonlySet<string>> {
  const paths = new Set<string>();
  for (const claim of claims) {
    if (claim.kind !== "file_exists") continue;
    const found = await github.pathExists(
      repo.repo,
      claim.params.path,
      repo.sha,
    );
    if (found.ok && found.value) paths.add(claim.params.path);
  }
  return paths;
}

export class PublicScanner {
  private readonly active = new Map<string, Promise<void>>();
  constructor(
    private readonly store: AppStore,
    private readonly github: PublicGitHubPort,
    private readonly model: ModelPort,
    private readonly cache: ModelCache,
    private readonly now: () => Date,
    private readonly onEvent?: (event: EventRecord) => void,
  ) {}

  async scan(repo: string): Promise<ScanResult> {
    requirePublicRecord(this.store, repo);
    if (this.active.has(repo)) return { state: "queued", repo };
    const fetched = await this.github.getRepo(repo);
    if (!fetched.ok) throw new Error(fetched.error.code);
    requirePublicRecord(this.store, repo);
    if (reusePublicScan(this.store, fetched.value, this.model))
      return { state: "cached", repo, commitSha: fetched.value.sha };
    const work = this.scanSnapshot(fetched.value).finally(() =>
      this.active.delete(repo),
    );
    this.active.set(repo, work);
    void work.catch(() => {
      const event = this.store.appendEvent(
        "scan_failed",
        this.now().toISOString(),
        { repo },
      );
      this.onEvent?.(event);
    });
    return { state: "queued", repo };
  }

  async scanNow(repo: string): Promise<void> {
    requirePublicRecord(this.store, repo);
    const fetched = await this.github.getRepo(repo);
    if (!fetched.ok) throw new Error(fetched.error.code);
    await this.scanSnapshot(fetched.value);
  }

  async scanTop(
    count: number,
  ): Promise<{ requested: number; scanned: number; failed: number }> {
    let scanned = 0;
    let requested = 0;
    const ranking = starRanking(this.github);
    while (scanned < count) {
      const next = await ranking.next();
      if (next.done) break;
      const repo = next.value;
      requested += 1;
      if (this.store.getRepo(repo)?.visibility === "private") continue;
      const fetched = await this.github.getRepo(repo);
      if (!fetched.ok) {
        this.onEvent?.(
          this.store.appendEvent("scan_failed", this.now().toISOString(), {
            repo,
            reason: fetched.error.code,
          }),
        );
        continue;
      }
      if (this.store.getRepo(repo)?.visibility === "private") continue;
      if (fetched.value.packageJson === null) continue;
      if (reusePublicScan(this.store, fetched.value, this.model)) {
        scanned += 1;
        continue;
      }
      try {
        await this.scanSnapshot(fetched.value);
        scanned += 1;
      } catch {
        this.onEvent?.(
          this.store.appendEvent("scan_failed", this.now().toISOString(), {
            repo,
          }),
        );
      }
    }
    return { requested, scanned, failed: requested - scanned };
  }

  private async scanSnapshot(repo: PublicRepo): Promise<void> {
    requirePublicRecord(this.store, repo.repo);
    const source = {
      id: `readme_${createHash("sha256").update(repo.repo).digest("hex").slice(0, 12)}`,
      repo: repo.repo,
      kind: "readme" as const,
      path: repo.readmePath,
    };
    const doc = markdownToDocText(source, repo.readme);
    const extracted = await extractFlightPlan(
      repo.repo,
      [doc],
      this.model,
      this.cache,
    );
    if (!extracted.ok) throw new Error(extracted.error.code);
    const paths = await pathFacts(
      this.github,
      repo,
      extracted.value.plan.claims,
    );
    requirePublicRecord(this.store, repo.repo);
    const results = runClaims(
      this.store,
      repo,
      extracted.value.plan.claims,
      paths,
    );
    const label = labelFor(results);
    const run: RunRecord = {
      id: runId(repo.repo, repo.sha),
      repo: repo.repo,
      commitSha: repo.sha,
      createdAt: this.now().toISOString(),
      verdict: results.some(
        (item) => item.state === "confirmed" && item.status === "fail",
      )
        ? "failure"
        : "success",
      origin: "public_scan",
      results,
      evidence: evidenceFor(results),
    };
    savePublicRecord(
      this.store,
      repo.repo,
      label,
      driftDegrees(results),
      run.id,
    );
    this.store.putRun(run);
    this.store.putSource({
      id: source.id,
      repo: repo.repo,
      kind: "readme",
      title: repo.readmePath,
      url: `https://github.com/${repo.repo}/blob/${repo.sha}/${repo.readmePath}`,
      claimCount: results.length,
    });
    const satellite: SatelliteRecord = {
      repo: repo.repo,
      stars: repo.stars,
      topicCluster: topicCluster(repo.topics, repo.language),
      readmeLagDays: daysBetween(repo.pushedAt, repo.readmeUpdatedAt),
      label,
      driftDegrees: driftDegrees(results),
      commitSha: repo.sha,
      scannedAt: this.now().toISOString(),
      tiersRun:
        this.model.model === "local-static" ? ["static"] : ["static", "ai"],
      simulated: false,
    };
    this.store.putSatellite(satellite);
    this.store.setSkyMode("live");
    const event = this.store.appendEvent(
      "scan_complete",
      this.now().toISOString(),
      { repo: repo.repo, runId: run.id },
    );
    this.onEvent?.(event);
  }
}
