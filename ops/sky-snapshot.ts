import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { type TrustState, trustStateSchema } from "@ground-control/plan";
import type {
  AppStore,
  RepoRecord,
  RunRecord,
  SatelliteRecord,
  SourceRecord,
} from "@ground-control/store";
import { z } from "zod";

type TrustEntry = { repo: string; claimId: string; state: TrustState };

export type SkySnapshot = {
  version: 1;
  exportedAt: string;
  satellites: SatelliteRecord[];
  repos: RepoRecord[];
  runs: RunRecord[];
  sources: SourceRecord[];
  trust: TrustEntry[];
};

const record = z.object({ repo: z.string() }).passthrough();
const snapshotSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  satellites: z.array(record),
  repos: z.array(record),
  runs: z.array(record),
  sources: z.array(record),
  trust: z.array(
    z.object({
      repo: z.string(),
      claimId: z.string(),
      state: trustStateSchema,
    }),
  ),
});

function trustFor(store: AppStore, runs: readonly RunRecord[]): TrustEntry[] {
  const entries = new Map<string, TrustEntry>();
  for (const run of runs)
    for (const result of run.results) {
      const state = store.getTrust(run.repo, result.claimId);
      if (state !== null)
        entries.set(`${run.repo}\n${result.claimId}`, {
          repo: run.repo,
          claimId: result.claimId,
          state,
        });
    }
  return [...entries.values()];
}

/**
 * Real public scan results only. Simulated filler and private repos stay out,
 * and connection state is cleared so no token hash leaves the database.
 */
export function snapshotSky(store: AppStore, exportedAt: string): SkySnapshot {
  const satellites = store
    .listSatellites()
    .filter(
      (item) =>
        !item.simulated && store.getRepo(item.repo)?.visibility === "public",
    );
  const names = satellites.map((item) => item.repo);
  const repos = names.flatMap((name) => {
    const repo = store.getRepo(name);
    return repo ? [{ ...repo, connected: false, tokenHash: null }] : [];
  });
  const runs = names.flatMap((name) => [...store.listRuns(name)]);
  const sources = names.flatMap((name) => [...store.listSources(name)]);
  return {
    version: 1,
    exportedAt,
    satellites,
    repos,
    runs,
    sources,
    trust: trustFor(store, runs),
  };
}

export function parseSkySnapshot(text: string): SkySnapshot {
  const parsed = snapshotSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error("invalid_sky_snapshot");
  return parsed.data as unknown as SkySnapshot;
}

function isNewer(existing: SatelliteRecord | null, next: SatelliteRecord) {
  return existing === null || existing.scannedAt <= next.scannedAt;
}

/**
 * Loads a snapshot without clobbering local state: private repos are skipped,
 * existing connections and trust are kept, and a newer local scan wins.
 */
export function restoreSky(
  store: AppStore,
  snapshot: SkySnapshot,
): { satellites: number; runs: number } {
  const blocked = (repo: string) =>
    store.getRepo(repo)?.visibility === "private";
  const allowed = new Set(
    snapshot.satellites
      .filter((item) => !item.simulated && !blocked(item.repo))
      .filter((item) => isNewer(store.getSatellite(item.repo), item))
      .map((item) => item.repo),
  );
  for (const repo of snapshot.repos.filter((item) => allowed.has(item.repo))) {
    const prior = store.getRepo(repo.repo);
    store.putRepo({
      ...repo,
      visibility: "public",
      connected: prior?.connected ?? false,
      tokenHash: prior?.tokenHash ?? null,
    });
  }
  const runs = snapshot.runs.filter((item) => allowed.has(item.repo));
  for (const run of runs) store.putRun(run);
  for (const source of snapshot.sources)
    if (allowed.has(source.repo)) store.putSource(source);
  for (const entry of snapshot.trust)
    if (allowed.has(entry.repo) && !store.getTrust(entry.repo, entry.claimId))
      store.setTrust(entry.repo, entry.claimId, entry.state);
  for (const satellite of snapshot.satellites)
    if (allowed.has(satellite.repo)) store.putSatellite(satellite);
  if (allowed.size > 0) store.setSkyMode("live");
  return { satellites: allowed.size, runs: runs.length };
}

export function skySnapshotCommand(
  store: AppStore,
  command: "sky:save" | "sky:load",
  pathArgument: string | undefined,
): object {
  const database = resolve(
    process.env.DATABASE_PATH || "data/groundcontrol.db",
  );
  const path = resolve(
    pathArgument ?? `${dirname(database)}/sky-snapshot.json`,
  );
  if (command === "sky:load")
    return {
      path,
      ...restoreSky(store, parseSkySnapshot(readFileSync(path, "utf8"))),
    };
  const snapshot = snapshotSky(store, new Date().toISOString());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return {
    path,
    satellites: snapshot.satellites.length,
    runs: snapshot.runs.length,
  };
}
