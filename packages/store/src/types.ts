import type { Check, FlightPlan, TrustState } from "@ground-control/plan";
import type { DocText } from "@ground-control/sources";

export type Visibility = "public" | "private";
export type Verdict = "success" | "failure";
export type CheckStatus = "pass" | "fail" | "skipped" | "unverified" | "flaky";
export type SkyMode = "live" | "cached" | "simulated";

export type RepoRecord = {
  repo: string;
  visibility: Visibility;
  connected: boolean;
  tokenHash: string | null;
  runtimeEnabled?: boolean;
  label: string;
  driftDegrees: number;
  latestRunId: string | null;
  recentRunsClearedAt?: string;
};

export type SourceRecord = {
  id: string;
  repo: string;
  kind: "readme" | "docs" | "wiki" | "man" | "confluence" | "url";
  title: string;
  url: string;
  claimCount: number;
};

export type SourceSnapshot = {
  sourceId: string;
  repo: string;
  status: "fresh" | "error";
  contentHash: string | null;
  version: string | null;
  fetchedAt: string;
  errorCode: string | null;
  doc: DocText | null;
};

export type RunClaim = Check & {
  claimId: string;
  sourceId: string;
  quote: string;
  state: TrustState;
  status: CheckStatus;
  expected: string;
  actual: string;
  deepLink: string | null;
};

export type FactEvidence = {
  factKey: string;
  kind: Check["kind"];
  params: Check["params"];
  claims: readonly {
    claimId: string;
    sourceId: string;
    quote: string;
    expected: string;
    actual: string;
    deepLink: string | null;
  }[];
};

export type RunRecord = {
  id: string;
  repo: string;
  commitSha: string;
  createdAt: string;
  verdict: Verdict;
  origin?: "public_scan" | "ci";
  pullRequestNumber?: number;
  results: readonly RunClaim[];
  evidence: readonly FactEvidence[];
};

export type ClaimFixRecord = {
  repo: string;
  claimId: string;
  pullRequestUrl: string;
  createdAt: string;
};

export type SatelliteRecord = {
  repo: string;
  stars: number;
  topicCluster: string;
  readmeLagDays: number;
  label: string;
  driftDegrees: number;
  commitSha: string;
  scannedAt: string;
  tiersRun: readonly ("static" | "ai" | "runtime")[];
  simulated: boolean;
};

export type SessionRecord = {
  idHash: string;
  login: string;
  encryptedToken: string;
  expiresAt: number;
};

export type EventRecord = {
  sequence: number;
  kind: string;
  at: string;
  payload: unknown;
};

export interface AppStore {
  getRepo(repo: string): RepoRecord | null;
  putRepo(repo: RepoRecord): void;
  listRepos(): readonly RepoRecord[];
  getSource(id: string): SourceRecord | null;
  putSource(source: SourceRecord): void;
  listSources(repo: string): readonly SourceRecord[];
  findSourceByUrl(url: string): readonly SourceRecord[];
  getSourceSnapshot(sourceId: string): SourceSnapshot | null;
  putSourceSnapshot(snapshot: SourceSnapshot): void;
  getFlightPlan(repo: string): FlightPlan | null;
  putFlightPlan(plan: FlightPlan): void;
  getRun(id: string): RunRecord | null;
  putRun(run: RunRecord): void;
  listRuns(repo: string): readonly RunRecord[];
  getTrust(repo: string, claimId: string): TrustState | null;
  setTrust(repo: string, claimId: string, state: TrustState): void;
  getClaimFix(repo: string, claimId: string): ClaimFixRecord | null;
  putClaimFix(fix: ClaimFixRecord): void;
  getSatellite(repo: string): SatelliteRecord | null;
  putSatellite(satellite: SatelliteRecord): void;
  listSatellites(): readonly SatelliteRecord[];
  getSkyMode(): SkyMode;
  setSkyMode(mode: SkyMode): void;
  consumeScanQuota(
    ip: string,
    nowMs: number,
    limit: number,
    windowMs: number,
  ): boolean;
  getSession(idHash: string): SessionRecord | null;
  putSession(session: SessionRecord): void;
  deleteSession(idHash: string): void;
  appendEvent(kind: string, at: string, payload: unknown): EventRecord;
  eventsAfter(sequence: number): readonly EventRecord[];
}
