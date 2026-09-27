import { Database } from "bun:sqlite";
import type { FlightPlan, TrustState } from "@ground-control/plan";
import type {
  AppStore,
  EventRecord,
  RepoRecord,
  RunRecord,
  SatelliteRecord,
  SessionRecord,
  SkyMode,
  SourceRecord,
  SourceSnapshot,
} from "./types.ts";

const migrations = [
  `CREATE TABLE IF NOT EXISTS records (
    bucket TEXT NOT NULL,
    key TEXT NOT NULL,
    body TEXT NOT NULL,
    PRIMARY KEY (bucket, key)
  );
  CREATE TABLE IF NOT EXISTS scan_attempts (
    ip TEXT NOT NULL,
    at_ms INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS scan_attempts_window ON scan_attempts(ip, at_ms);
  CREATE TABLE IF NOT EXISTS events (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    at TEXT NOT NULL,
    payload TEXT NOT NULL
  );`,
] as const;

type BodyRow = { body: string };
type EventRow = { sequence: number; kind: string; at: string; payload: string };

export class SqliteStore implements AppStore {
  private readonly db: Database;

  constructor(path: string) {
    this.db = new Database(path, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    const version = this.db.query("PRAGMA user_version").get() as {
      user_version: number;
    } | null;
    for (
      let index = version?.user_version ?? 0;
      index < migrations.length;
      index += 1
    ) {
      const migration = migrations[index];
      if (migration === undefined)
        throw new Error("Missing numbered migration");
      this.db.exec(migration);
      this.db.exec(`PRAGMA user_version = ${index + 1};`);
    }
  }

  close(): void {
    this.db.close();
  }

  private read<T>(bucket: string, key: string): T | null {
    const row = this.db
      .query("SELECT body FROM records WHERE bucket = ? AND key = ?")
      .get(bucket, key) as BodyRow | null;
    return row === null ? null : (JSON.parse(row.body) as T);
  }

  private write(bucket: string, key: string, value: unknown): void {
    this.db
      .query(`INSERT INTO records(bucket, key, body) VALUES(?, ?, ?)
      ON CONFLICT(bucket, key) DO UPDATE SET body = excluded.body`)
      .run(bucket, key, JSON.stringify(value));
  }

  private list<T>(bucket: string): readonly T[] {
    const rows = this.db
      .query("SELECT body FROM records WHERE bucket = ?")
      .all(bucket) as BodyRow[];
    return rows.map((row) => JSON.parse(row.body) as T);
  }

  getRepo(repo: string): RepoRecord | null {
    return this.read("repo", repo);
  }
  putRepo(repo: RepoRecord): void {
    this.write("repo", repo.repo, repo);
  }
  listRepos(): readonly RepoRecord[] {
    return this.list("repo");
  }
  getSource(id: string): SourceRecord | null {
    return this.read("source", id);
  }
  putSource(source: SourceRecord): void {
    this.write("source", source.id, source);
  }
  listSources(repo: string): readonly SourceRecord[] {
    return this.list<SourceRecord>("source").filter(
      (source) => source.repo === repo,
    );
  }
  findSourceByUrl(url: string): readonly SourceRecord[] {
    return this.list<SourceRecord>("source").filter(
      (source) => source.url === url,
    );
  }
  getSourceSnapshot(sourceId: string): SourceSnapshot | null {
    return this.read("source_snapshot", sourceId);
  }
  putSourceSnapshot(snapshot: SourceSnapshot): void {
    this.write("source_snapshot", snapshot.sourceId, snapshot);
  }
  getFlightPlan(repo: string): FlightPlan | null {
    return this.read("flight_plan", repo);
  }
  putFlightPlan(plan: FlightPlan): void {
    this.write("flight_plan", plan.repo, plan);
  }
  getRun(id: string): RunRecord | null {
    return this.read("run", id);
  }
  putRun(run: RunRecord): void {
    this.write("run", run.id, run);
  }
  listRuns(repo: string): readonly RunRecord[] {
    return this.list<RunRecord>("run")
      .filter((run) => run.repo === repo)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
  getTrust(repo: string, claimId: string): TrustState | null {
    return this.read("trust", `${repo}\n${claimId}`);
  }
  setTrust(repo: string, claimId: string, state: TrustState): void {
    this.write("trust", `${repo}\n${claimId}`, state);
  }
  getSatellite(repo: string): SatelliteRecord | null {
    return this.read("satellite", repo);
  }
  putSatellite(satellite: SatelliteRecord): void {
    this.write("satellite", satellite.repo, satellite);
  }
  listSatellites(): readonly SatelliteRecord[] {
    return this.list("satellite");
  }
  getSkyMode(): SkyMode {
    return this.read<SkyMode>("meta", "sky_mode") ?? "simulated";
  }
  setSkyMode(mode: SkyMode): void {
    this.write("meta", "sky_mode", mode);
  }

  consumeScanQuota(
    ip: string,
    nowMs: number,
    limit: number,
    windowMs: number,
  ): boolean {
    this.db
      .query("DELETE FROM scan_attempts WHERE at_ms <= ?")
      .run(nowMs - windowMs);
    const row = this.db
      .query("SELECT COUNT(*) AS count FROM scan_attempts WHERE ip = ?")
      .get(ip) as { count: number } | null;
    if ((row?.count ?? 0) >= limit) return false;
    this.db
      .query("INSERT INTO scan_attempts(ip, at_ms) VALUES(?, ?)")
      .run(ip, nowMs);
    return true;
  }

  getSession(idHash: string): SessionRecord | null {
    return this.read("session", idHash);
  }
  putSession(session: SessionRecord): void {
    this.write("session", session.idHash, session);
  }
  deleteSession(idHash: string): void {
    this.db
      .query("DELETE FROM records WHERE bucket = 'session' AND key = ?")
      .run(idHash);
  }

  appendEvent(kind: string, at: string, payload: unknown): EventRecord {
    this.db
      .query("INSERT INTO events(kind, at, payload) VALUES(?, ?, ?)")
      .run(kind, at, JSON.stringify(payload));
    const row = this.db
      .query("SELECT MAX(sequence) AS sequence FROM events")
      .get() as { sequence: number } | null;
    return { sequence: row?.sequence ?? 0, kind, at, payload };
  }

  eventsAfter(sequence: number): readonly EventRecord[] {
    const rows = this.db
      .query(
        "SELECT sequence, kind, at, payload FROM events WHERE sequence > ? ORDER BY sequence",
      )
      .all(sequence) as EventRow[];
    return rows.map((row) => ({
      sequence: row.sequence,
      kind: row.kind,
      at: row.at,
      payload: JSON.parse(row.payload) as unknown,
    }));
  }
}
