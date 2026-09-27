import { createHash } from "node:crypto";
import { canonicalJson, checkSchema, factKey } from "@ground-control/plan";
import { driftDegrees, evidenceFor, labelFor } from "@ground-control/scanner";
import type {
  AppStore,
  FactEvidence,
  RepoRecord,
  RunClaim,
  RunRecord,
} from "@ground-control/store";
import { z } from "zod";

const repoSchema = z.string().regex(/^[^/\s]+\/[^/\s]+$/);
const shaSchema = z.string().regex(/^[0-9a-f]{7,64}$/);
const telemetryResultSchema = z.intersection(
  checkSchema,
  z.object({
    claimId: z.string().regex(/^c_[0-9a-f]{10}$/),
    sourceId: z.string().min(1),
    quote: z.string().min(1),
    status: z.enum(["pass", "fail", "skipped", "unverified", "flaky"]),
    expected: z.string(),
    actual: z.string(),
    deepLink: z.url().nullable().optional(),
  }),
);

export const telemetrySchema = z.object({
  repo: repoSchema,
  commitSha: shaSchema,
  results: z.array(telemetryResultSchema),
  authorLogin: z
    .string()
    .regex(/^[A-Za-z0-9-]{1,39}$/)
    .optional(),
  codeChanged: z.boolean().optional(),
  docsChanged: z.boolean().optional(),
  changedFiles: z.array(z.string().min(1).max(500)).max(1_000).optional(),
  pullRequestNumber: z.int().positive().max(2_147_483_647).optional(),
});

export type TelemetryInput = z.infer<typeof telemetrySchema>;

function trustFor(
  store: AppStore,
  repo: string,
  result: TelemetryInput["results"][number],
): RunClaim["state"] {
  const old = store.getTrust(repo, result.claimId);
  if (old === "confirmed" && result.status === "flaky") {
    const recent = store
      .listRuns(repo)
      .slice(0, 9)
      .flatMap((run) => run.results);
    const flakes = recent.filter(
      (item) => item.claimId === result.claimId && item.status === "flaky",
    ).length;
    if (flakes >= 2) {
      store.setTrust(repo, result.claimId, "disputed");
      return "disputed";
    }
  }
  if (old !== null && old !== "unconfirmed") return old;
  const state =
    result.status === "pass"
      ? "confirmed"
      : result.status === "fail" || result.status === "flaky"
        ? "disputed"
        : "unconfirmed";
  store.setTrust(repo, result.claimId, state);
  return state;
}

function resultWithTrust(
  store: AppStore,
  repo: string,
  item: TelemetryInput["results"][number],
): RunClaim {
  const state = trustFor(store, repo, item);
  return {
    ...item,
    state,
    deepLink: item.deepLink ?? null,
    actual: item.actual.split(/\r?\n/).slice(0, 20).join("\n"),
  };
}

function groupedEvidence(
  results: readonly RunClaim[],
): readonly FactEvidence[] {
  const groups = new Map<string, FactEvidence>();
  for (const result of results) {
    if (result.state !== "confirmed" || result.status !== "fail") continue;
    const key = factKey(result.kind, result.params);
    const claim = {
      claimId: result.claimId,
      sourceId: result.sourceId,
      quote: result.quote,
      expected: result.expected,
      actual: result.actual,
      deepLink: result.deepLink,
    };
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, {
        factKey: key,
        kind: result.kind,
        params: result.params,
        claims: [claim],
      });
    } else {
      groups.set(key, { ...group, claims: [...group.claims, claim] });
    }
  }
  return [...groups.values()].sort((left, right) =>
    left.factKey.localeCompare(right.factKey),
  );
}

function verdictFor(results: readonly RunClaim[]): RunRecord["verdict"] {
  return results.some(
    (result) => result.state === "confirmed" && result.status === "fail",
  )
    ? "failure"
    : "success";
}

function repoWithRun(repo: RepoRecord, run: RunRecord): RepoRecord {
  const confirmed = run.results.filter(
    (result) => result.state === "confirmed",
  );
  const failing = confirmed.filter((result) => result.status === "fail").length;
  const label =
    confirmed.length === 0
      ? "No telemetry"
      : failing > 0
        ? "Drifting"
        : "On course";
  const driftDegrees =
    confirmed.length === 0 ? 0 : (90 * failing) / confirmed.length;
  return { ...repo, label, driftDegrees, latestRunId: run.id };
}

export function ingestTelemetry(
  store: AppStore,
  input: TelemetryInput,
  now: Date,
): RunRecord {
  const id = `run_${createHash("sha256")
    .update(
      `${input.repo}\n${input.commitSha}\n${canonicalJson(input.results)}`,
    )
    .digest("hex")
    .slice(0, 16)}`;
  const existing = store.getRun(id);
  if (existing !== null) {
    if (
      input.pullRequestNumber &&
      existing.pullRequestNumber !== input.pullRequestNumber
    ) {
      const updated = {
        ...existing,
        pullRequestNumber: input.pullRequestNumber,
      };
      store.putRun(updated);
      return updated;
    }
    return existing;
  }
  const results = input.results.map((item) =>
    resultWithTrust(store, input.repo, item),
  );
  const run: RunRecord = {
    id,
    repo: input.repo,
    commitSha: input.commitSha,
    createdAt: now.toISOString(),
    verdict: verdictFor(results),
    origin: "ci",
    ...(input.pullRequestNumber
      ? { pullRequestNumber: input.pullRequestNumber }
      : {}),
    results,
    evidence: groupedEvidence(results),
  };
  store.putRun(run);
  const repo = store.getRepo(input.repo);
  if (repo !== null) store.putRepo(repoWithRun(repo, run));
  return run;
}

export function refreshTrust(
  store: AppStore,
  repoName: string,
  claimId: string,
  state: RunClaim["state"],
): RunRecord | null {
  store.setTrust(repoName, claimId, state);
  for (const old of store.listRuns(repoName)) {
    const results = old.results.map((item) =>
      item.claimId === claimId ? { ...item, state } : item,
    );
    store.putRun({
      ...old,
      results,
      verdict: verdictFor(results),
      evidence:
        old.origin === "public_scan"
          ? evidenceFor(results)
          : groupedEvidence(results),
    });
  }
  rescoreSatellite(store, repoName);
  const repo = store.getRepo(repoName);
  if (repo === null || repo.latestRunId === null) return null;
  const latest = store.getRun(repo.latestRunId);
  if (latest === null) return null;
  store.putRepo(
    latest.origin === "public_scan"
      ? {
          ...repo,
          label: labelFor(latest.results),
          driftDegrees: driftDegrees(latest.results),
        }
      : repoWithRun(repo, latest),
  );
  return latest;
}

function rescoreSatellite(store: AppStore, repoName: string): void {
  const satellite = store.getSatellite(repoName);
  if (satellite === null || satellite.simulated) return;
  const scan = store
    .listRuns(repoName)
    .find(
      (run) =>
        run.origin === "public_scan" && run.commitSha === satellite.commitSha,
    );
  if (scan === undefined) return;
  store.putSatellite({
    ...satellite,
    label: labelFor(scan.results),
    driftDegrees: driftDegrees(scan.results),
  });
}
