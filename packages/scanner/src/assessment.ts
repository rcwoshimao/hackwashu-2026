import type { Claim } from "@ground-control/plan";
import { memorySnapshot, runStaticCheck } from "@ground-control/runner";
import type { AppStore, RunClaim, RunRecord } from "@ground-control/store";
import type { PublicRepo } from "./github.ts";

function deepLink(repo: PublicRepo, claim: Claim): string | null {
  const location = claim.occurrences[0]?.location;
  if (location?.kind !== "file") return null;
  const path = location.path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repo.repo}/blob/${repo.sha}/${path}#L${location.lineStart}-L${location.lineEnd}`;
}

function staticStatus(
  claim: Claim,
  packageJson: string | null,
  existingPaths: ReadonlySet<string>,
): RunClaim["status"] {
  if (
    [
      "command_succeeds",
      "port_listens",
      "http_example",
      "cli_flag",
      "code_reference",
      "env_var",
    ].includes(claim.kind)
  )
    return "unverified";
  const files: Record<string, string> = {};
  if (packageJson !== null) files["package.json"] = packageJson;
  for (const path of existingPaths) files[path] = "";
  const result = runStaticCheck(
    claim as Extract<
      Claim,
      { kind: "file_exists" | "script_exists" | "version" }
    >,
    memorySnapshot(files),
  );
  return result.ok ? result.value.status : "unverified";
}

export function runClaims(
  store: AppStore,
  repo: PublicRepo,
  claims: readonly Claim[],
  paths: ReadonlySet<string>,
): RunClaim[] {
  return claims.map((claim) => {
    const status = staticStatus(claim, repo.packageJson, paths);
    const previous = store.getTrust(repo.repo, claim.id);
    const state = previous ?? (status === "pass" ? "confirmed" : "disputed");
    if (previous === null) store.setTrust(repo.repo, claim.id, state);
    return {
      ...claim,
      claimId: claim.id,
      sourceId: claim.sourceId,
      quote: claim.occurrences[0]?.quote ?? "",
      state,
      status,
      expected: JSON.stringify(claim.params),
      actual: status,
      deepLink: deepLink(repo, claim),
    };
  });
}

export function labelFor(results: readonly RunClaim[]): string {
  const checkable = results.filter(
    (item) => item.status === "pass" || item.status === "fail",
  );
  if (checkable.length < 3) return "No telemetry";
  const confirmedFailures = checkable.filter(
    (item) => item.state === "confirmed" && item.status === "fail",
  );
  if (confirmedFailures.length >= checkable.length / 2) return "Lost signal";
  if (confirmedFailures.length > 0) return "Drifting";
  if (checkable.some((item) => item.status === "fail")) return "Possible drift";
  return "On course";
}

export function driftDegrees(results: readonly RunClaim[]): number {
  const checkable = results.filter(
    (item) => item.status === "pass" || item.status === "fail",
  );
  if (checkable.length === 0) return 0;
  return Math.round(
    (90 * checkable.filter((item) => item.status === "fail").length) /
      checkable.length,
  );
}

export function evidenceFor(
  results: readonly RunClaim[],
): RunRecord["evidence"] {
  const facts = new Map<string, RunRecord["evidence"][number]>();
  for (const result of results.filter((item) => item.status === "fail")) {
    const factKey = `${result.kind}:${JSON.stringify(result.params)}`;
    const previous = facts.get(factKey);
    const detail = {
      claimId: result.claimId,
      sourceId: result.sourceId,
      quote: result.quote,
      expected: result.expected,
      actual: result.actual,
      deepLink: result.deepLink,
    };
    facts.set(
      factKey,
      previous
        ? { ...previous, claims: [...previous.claims, detail] }
        : {
            factKey,
            kind: result.kind,
            params: result.params,
            claims: [detail],
          },
    );
  }
  return [...facts.values()];
}
