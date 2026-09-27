import type { FlightPlan, TrustState } from "@ground-control/plan";
import type {
  AppStore,
  ClaimFixRecord,
  EventRecord,
  RepoRecord,
  RunRecord,
  SatelliteRecord,
  SessionRecord,
  SkyMode,
  SourceRecord,
  SourceSnapshot,
} from "./types.ts";

export class MemoryStore implements AppStore {
  private readonly repos = new Map<string, RepoRecord>();
  private readonly sources = new Map<string, SourceRecord>();
  private readonly snapshots = new Map<string, SourceSnapshot>();
  private readonly plans = new Map<string, FlightPlan>();
  private readonly runs = new Map<string, RunRecord>();
  private readonly trusts = new Map<string, TrustState>();
  private readonly claimFixes = new Map<string, ClaimFixRecord>();
  private readonly satellites = new Map<string, SatelliteRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly scans = new Map<string, number[]>();
  private readonly events: EventRecord[] = [];
  private skyMode: SkyMode = "simulated";

  getRepo(repo: string): RepoRecord | null {
    return this.repos.get(repo) ?? null;
  }
  putRepo(repo: RepoRecord): void {
    this.repos.set(repo.repo, repo);
  }
  listRepos(): readonly RepoRecord[] {
    return [...this.repos.values()];
  }
  getSource(id: string): SourceRecord | null {
    return this.sources.get(id) ?? null;
  }
  putSource(source: SourceRecord): void {
    this.sources.set(source.id, source);
  }
  listSources(repo: string): readonly SourceRecord[] {
    return [...this.sources.values()].filter((source) => source.repo === repo);
  }
  findSourceByUrl(url: string): readonly SourceRecord[] {
    return [...this.sources.values()].filter((source) => source.url === url);
  }
  getSourceSnapshot(sourceId: string): SourceSnapshot | null {
    return this.snapshots.get(sourceId) ?? null;
  }
  putSourceSnapshot(snapshot: SourceSnapshot): void {
    this.snapshots.set(snapshot.sourceId, snapshot);
  }
  getFlightPlan(repo: string): FlightPlan | null {
    return this.plans.get(repo) ?? null;
  }
  putFlightPlan(plan: FlightPlan): void {
    this.plans.set(plan.repo, plan);
  }
  getRun(id: string): RunRecord | null {
    return this.runs.get(id) ?? null;
  }
  putRun(run: RunRecord): void {
    this.runs.set(run.id, run);
  }
  listRuns(repo: string): readonly RunRecord[] {
    return [...this.runs.values()]
      .filter((run) => run.repo === repo)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
  getTrust(repo: string, claimId: string): TrustState | null {
    return this.trusts.get(`${repo}\n${claimId}`) ?? null;
  }
  setTrust(repo: string, claimId: string, state: TrustState): void {
    this.trusts.set(`${repo}\n${claimId}`, state);
  }
  getClaimFix(repo: string, claimId: string): ClaimFixRecord | null {
    return this.claimFixes.get(`${repo}\n${claimId}`) ?? null;
  }
  putClaimFix(fix: ClaimFixRecord): void {
    this.claimFixes.set(`${fix.repo}\n${fix.claimId}`, fix);
  }
  getSatellite(repo: string): SatelliteRecord | null {
    return this.satellites.get(repo) ?? null;
  }
  putSatellite(satellite: SatelliteRecord): void {
    this.satellites.set(satellite.repo, satellite);
  }
  listSatellites(): readonly SatelliteRecord[] {
    return [...this.satellites.values()];
  }
  getSkyMode(): SkyMode {
    return this.skyMode;
  }
  setSkyMode(mode: SkyMode): void {
    this.skyMode = mode;
  }
  consumeScanQuota(
    ip: string,
    nowMs: number,
    limit: number,
    windowMs: number,
  ): boolean {
    const recent = (this.scans.get(ip) ?? []).filter(
      (time) => time > nowMs - windowMs,
    );
    if (recent.length >= limit) return false;
    recent.push(nowMs);
    this.scans.set(ip, recent);
    return true;
  }
  getSession(idHash: string): SessionRecord | null {
    return this.sessions.get(idHash) ?? null;
  }
  putSession(session: SessionRecord): void {
    this.sessions.set(session.idHash, session);
  }
  deleteSession(idHash: string): void {
    this.sessions.delete(idHash);
  }
  appendEvent(kind: string, at: string, payload: unknown): EventRecord {
    const event = { sequence: this.events.length + 1, kind, at, payload };
    this.events.push(event);
    return event;
  }
  eventsAfter(sequence: number): readonly EventRecord[] {
    return this.events.filter((event) => event.sequence > sequence);
  }
}
