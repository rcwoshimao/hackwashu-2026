import { z } from "zod";

export const satelliteSchema = z.object({
  repo: z.string(),
  stars: z.number().nonnegative(),
  topicCluster: z.string(),
  readmeLagDays: z.number().nonnegative(),
  label: z.string(),
  driftDegrees: z.number().min(0).max(90),
  commitSha: z.string(),
  scannedAt: z.string(),
  tiersRun: z.array(z.string()),
  simulated: z.boolean(),
});

export const skySchema = z.object({
  mode: z.enum(["live", "cached", "simulated", "empty"]),
  updatedAt: z.string(),
  satellites: z.array(satelliteSchema),
  findings: z.object({
    realCount: z.number().nonnegative(),
    driftingCount: z.number().nonnegative(),
    medianLagDays: z.number().nonnegative().nullable(),
  }),
});

export const sourceSyncSchema = z.object({
  status: z.enum(["fresh", "error", "pending"]),
  contentHash: z.string().nullable(),
  version: z.string().nullable(),
  fetchedAt: z.string().nullable(),
  errorCode: z.string().nullable(),
});

export const sourceSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  url: z.string(),
  claimCount: z.number().nonnegative(),
  sync: sourceSyncSchema.optional(),
});

export const runSummarySchema = z.object({
  id: z.string(),
  commitSha: z.string(),
  createdAt: z.string(),
  verdict: z.string(),
  origin: z.enum(["public_scan", "ci", "unknown"]),
  failingCount: z.number().nonnegative(),
});

export const repoSchema = z.object({
  repo: z.string(),
  visibility: z.enum(["public", "private"]),
  runtimeEnabled: z.boolean(),
  label: z.string(),
  driftDegrees: z.number().min(0).max(90),
  latestRunId: z.string().nullable(),
  recentRunsClearedAt: z.string().optional(),
  latestCiRun: runSummarySchema.nullable().optional(),
  scan: z
    .object({
      commitSha: z.string(),
      scannedAt: z.string(),
      tiersRun: z.array(z.string()),
    })
    .nullable(),
  sources: z.array(sourceSchema),
  runs: z.array(runSummarySchema),
});

export const checkResultSchema = z.object({
  claimId: z.string(),
  state: z.string(),
  status: z.string(),
  quote: z.string(),
  sourceId: z.string(),
  expected: z.string(),
  actual: z.string(),
  kind: z.string().optional(),
  params: z.unknown().optional(),
  deepLink: z.string().nullable().optional(),
});

export const evidenceGroupSchema = z.object({
  factKey: z.string(),
  kind: z.string(),
  params: z.unknown(),
  claims: z.array(
    z.object({
      claimId: z.string(),
      sourceId: z.string(),
      quote: z.string(),
      expected: z.string(),
      actual: z.string(),
      deepLink: z.string().nullable(),
    }),
  ),
});

export const runSchema = z.object({
  id: z.string(),
  repo: z.string(),
  commitSha: z.string(),
  createdAt: z.string(),
  verdict: z.string(),
  origin: z.enum(["public_scan", "ci"]).optional(),
  results: z.array(checkResultSchema),
  evidence: z.array(evidenceGroupSchema),
  fixes: z.record(z.string(), z.string()).optional(),
  fixAvailable: z.boolean().optional(),
});

export const meSchema = z.object({
  signedIn: z.boolean(),
  login: z.string().optional(),
  connectedRepos: z.array(z.string()),
});

export const accountRepoSchema = z.object({
  repo: z.string(),
  visibility: z.enum(["public", "private"]),
  canAdmin: z.boolean(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  updatedAt: z.string().nullable(),
  archived: z.boolean(),
  fork: z.boolean(),
  connected: z.boolean(),
  runtimeEnabled: z.boolean(),
  deepChecksSetup: z.boolean().optional(),
  checked: z.boolean(),
  label: z.string().nullable(),
  scanned: z.boolean(),
});

export const accountReposSchema = z.object({
  repos: z.array(accountRepoSchema),
  truncated: z.boolean(),
});

export type Satellite = z.infer<typeof satelliteSchema>;
export type SkyData = z.infer<typeof skySchema>;
export type RepoData = z.infer<typeof repoSchema>;
export type RunData = z.infer<typeof runSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type EvidenceGroup = z.infer<typeof evidenceGroupSchema>;
export type MeData = z.infer<typeof meSchema>;
export type AccountRepoData = z.infer<typeof accountRepoSchema>;
export type AccountReposData = z.infer<typeof accountReposSchema>;
export type SourceData = z.infer<typeof sourceSchema>;
export type SourceSync = z.infer<typeof sourceSyncSchema>;

export function measuredFindings(satellites: Satellite[]) {
  const real = satellites.filter((satellite) => !satellite.simulated);
  const drifting = real.filter(
    (satellite) => satellite.label.toLowerCase() === "drifting",
  );
  const lags = real
    .map((satellite) => satellite.readmeLagDays)
    .sort((a, b) => a - b);
  const middle = Math.floor(lags.length / 2);
  const medianLagDays =
    lags.length === 0
      ? null
      : lags.length % 2 === 1
        ? (lags[middle] ?? 0)
        : ((lags[middle - 1] ?? 0) + (lags[middle] ?? 0)) / 2;
  return {
    realCount: real.length,
    driftingCount: drifting.length,
    medianLagDays,
  };
}

export function confirmedDriftDegrees(run: RunData): number | null {
  const confirmed = run.results.filter(
    (result) =>
      result.state === "confirmed" &&
      (result.status === "pass" || result.status === "fail"),
  );
  if (confirmed.length === 0) return null;
  return (
    (90 * confirmed.filter((result) => result.status === "fail").length) /
    confirmed.length
  );
}
