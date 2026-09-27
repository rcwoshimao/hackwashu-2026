import type { ModelCache, ModelPort } from "@ground-control/ai";
import { extractFlightPlan } from "@ground-control/ai";
import { sourceTextHash } from "@ground-control/sources";
import type {
  AppStore,
  SourceRecord,
  SourceSnapshot,
} from "@ground-control/store";
import { fetchDocument, type ReaderDeps } from "./convert.ts";
import { discoverConnected } from "./discover.ts";
import { resolveSource } from "./resolve.ts";
import type { Result, SyncErrorCode, SyncStatus } from "./types.ts";

export type SyncDeps = ReaderDeps & {
  store: AppStore;
  confluenceSite?: string | undefined;
  now: () => Date;
  model?: ModelPort;
  cache?: ModelCache;
  onUpdate?: (snapshot: SourceSnapshot, changed: boolean) => void;
  onPlan?: (repo: string, claimCount: number | null) => void;
};

export function sourceStatus(snapshot: SourceSnapshot | null): SyncStatus {
  return snapshot
    ? {
        status: snapshot.status,
        contentHash: snapshot.contentHash,
        version: snapshot.version,
        fetchedAt: snapshot.fetchedAt,
        errorCode: snapshot.errorCode as SyncErrorCode | null,
      }
    : {
        status: "pending",
        contentHash: null,
        version: null,
        fetchedAt: null,
        errorCode: null,
      };
}

function intervalMs(kind: SourceRecord["kind"]): number {
  return kind === "wiki" || kind === "confluence" ? 10 * 60_000 : 60 * 60_000;
}

export class SourceSync {
  private readonly inFlight = new Map<string, Promise<Result<SyncStatus>>>();
  private readonly planQueue = new Map<string, Promise<void>>();
  constructor(private readonly deps: SyncDeps) {}

  discover(
    repo: string,
    userToken?: string,
  ): Promise<Result<readonly SourceRecord[]>> {
    return discoverConnected(repo, userToken, this.deps);
  }

  status(sourceId: string): Result<SyncStatus> {
    const source = this.deps.store.getSource(sourceId);
    return source
      ? {
          ok: true,
          value: sourceStatus(this.deps.store.getSourceSnapshot(sourceId)),
        }
      : { ok: false, error: { code: "not_found" } };
  }

  /**
   * `waitForPlan: false` returns once the fetch is stored and lets the model
   * rebuild the flight plan in the background, so a browser request is not
   * held open for the whole extraction.
   */
  refresh(
    sourceId: string,
    userToken?: string,
    options: { waitForPlan?: boolean } = {},
  ): Promise<Result<SyncStatus>> {
    const running = this.inFlight.get(sourceId);
    if (running) return running;
    const waitForPlan = options.waitForPlan ?? true;
    const task = this.refreshOne(sourceId, userToken, waitForPlan).finally(() =>
      this.inFlight.delete(sourceId),
    );
    this.inFlight.set(sourceId, task);
    return task;
  }

  private failure(
    source: SourceRecord,
    code: SyncErrorCode,
  ): Result<SyncStatus> {
    const previous = this.deps.store.getSourceSnapshot(source.id);
    const snapshot: SourceSnapshot = {
      sourceId: source.id,
      repo: source.repo,
      status: "error",
      contentHash: previous?.contentHash ?? null,
      version: previous?.version ?? null,
      doc: previous?.doc ?? null,
      fetchedAt: this.deps.now().toISOString(),
      errorCode: code,
    };
    this.deps.store.putSourceSnapshot(snapshot);
    this.deps.onUpdate?.(snapshot, false);
    return { ok: true, value: sourceStatus(snapshot) };
  }

  private async refreshOne(
    sourceId: string,
    userToken: string | undefined,
    waitForPlan: boolean,
  ): Promise<Result<SyncStatus>> {
    const source = this.deps.store.getSource(sourceId);
    if (!source) return { ok: false, error: { code: "not_found" } };
    const repo = this.deps.store.getRepo(source.repo);
    if (!repo?.connected) return this.failure(source, "invalid_source");
    const resolved = resolveSource(source, this.deps.confluenceSite);
    if (!resolved.ok) return this.failure(source, resolved.error.code);
    let fetched: Awaited<ReturnType<typeof fetchDocument>>;
    try {
      fetched = await fetchDocument(
        resolved.value,
        repo.visibility === "private",
        userToken,
        this.deps,
      );
    } catch {
      return this.failure(source, "http_error");
    }
    if (!fetched.ok) return this.failure(source, fetched.error.code);
    const previous = this.deps.store.getSourceSnapshot(source.id);
    const contentHash = sourceTextHash(fetched.value.doc.text);
    const changed = previous?.contentHash !== contentHash;
    const snapshot: SourceSnapshot = {
      sourceId,
      repo: source.repo,
      status: "fresh",
      contentHash,
      version: fetched.value.version,
      fetchedAt: this.deps.now().toISOString(),
      errorCode: null,
      doc: changed ? fetched.value.doc : (previous?.doc ?? fetched.value.doc),
    };
    this.deps.store.putSourceSnapshot(snapshot);
    this.deps.onUpdate?.(snapshot, changed);
    if (changed) {
      const plan = this.queuePlan(source.repo);
      if (waitForPlan) await plan;
    }
    return { ok: true, value: sourceStatus(snapshot) };
  }

  private async queuePlan(repo: string): Promise<void> {
    const prior = this.planQueue.get(repo) ?? Promise.resolve();
    const current = prior.then(() => this.regenerate(repo));
    this.planQueue.set(repo, current);
    await current;
    if (this.planQueue.get(repo) === current) this.planQueue.delete(repo);
  }

  private async regenerate(repo: string): Promise<void> {
    if (!this.deps.model || !this.deps.cache) return;
    const docs = this.deps.store
      .listSources(repo)
      .map(
        (source) => this.deps.store.getSourceSnapshot(source.id)?.doc ?? null,
      )
      .filter((doc) => doc !== null);
    if (docs.length === 0) return;
    try {
      const extracted = await extractFlightPlan(
        repo,
        docs,
        this.deps.model,
        this.deps.cache,
      );
      if (!extracted.ok) {
        this.deps.onPlan?.(repo, null);
        return;
      }
      this.deps.store.putFlightPlan(extracted.value.plan);
      this.deps.onPlan?.(repo, extracted.value.plan.claims.length);
    } catch {
      this.deps.onPlan?.(repo, null);
    }
  }

  async refreshDue(maxSources = 20): Promise<number> {
    const nowMs = this.deps.now().getTime();
    const sources = this.deps.store
      .listRepos()
      .filter((repo) => repo.connected)
      .flatMap((repo) => this.deps.store.listSources(repo.repo));
    let attempted = 0;
    for (const source of sources) {
      const last = this.deps.store.getSourceSnapshot(source.id)?.fetchedAt;
      if (last && nowMs - Date.parse(last) < intervalMs(source.kind)) continue;
      await this.refresh(source.id);
      attempted += 1;
      if (attempted >= maxSources) break;
    }
    return attempted;
  }

  start(onError: () => void, intervalMs = 60_000): () => void {
    const timer = setInterval(() => {
      void this.refreshDue().catch(onError);
    }, intervalMs);
    return () => clearInterval(timer);
  }
}
