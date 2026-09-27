import type { CheckResult, RunData } from "../data.ts";

export type FindingSummary = {
  passed: number;
  needsReview: number;
  confirmedFailures: number;
  unverified: number;
  reviewItems: CheckResult[];
  confirmedItems: CheckResult[];
  outcome:
    | "confirmed_drift"
    | "needs_review"
    | "no_confirmed_drift"
    | "unverified";
};

export function summarizeRun(run: RunData): FindingSummary {
  const active = run.results.filter((result) => result.state !== "dropped");
  const reviewItems = active.filter(
    (result) => result.status === "fail" && result.state !== "confirmed",
  );
  const confirmedItems = active.filter(
    (result) => result.status === "fail" && result.state === "confirmed",
  );
  const passed = active.filter((result) => result.status === "pass").length;
  return {
    passed,
    needsReview: reviewItems.length,
    confirmedFailures: confirmedItems.length,
    unverified: active.filter((result) => result.status === "unverified")
      .length,
    reviewItems,
    confirmedItems,
    outcome:
      confirmedItems.length > 0
        ? "confirmed_drift"
        : reviewItems.length > 0
          ? "needs_review"
          : passed > 0
            ? "no_confirmed_drift"
            : "unverified",
  };
}

export type ClaimVerdict = "wrong" | "maybe" | "unchecked" | "ok";

export type ChecklistItem = { result: CheckResult; verdict: ClaimVerdict };

const verdictOrder: readonly ClaimVerdict[] = [
  "wrong",
  "maybe",
  "unchecked",
  "ok",
];

export function claimVerdict(result: CheckResult): ClaimVerdict {
  if (result.status === "pass") return "ok";
  if (result.status === "fail")
    return result.state === "confirmed" ? "wrong" : "maybe";
  return "unchecked";
}

/** Problems first, so a reader sees what needs attention before what passed. */
export function checklist(run: RunData): ChecklistItem[] {
  return run.results
    .filter((result) => result.state !== "dropped")
    .map((result) => ({ result, verdict: claimVerdict(result) }))
    .sort(
      (left, right) =>
        verdictOrder.indexOf(left.verdict) -
        verdictOrder.indexOf(right.verdict),
    );
}

export type RepoHeadline =
  | "wrong"
  | "maybe"
  | "ok"
  | "unchecked"
  | "nothing_found";

/** Separates "found nothing to test" from "found claims but could not test them". */
export function repoHeadline(summary: FindingSummary): RepoHeadline {
  if (summary.outcome === "confirmed_drift") return "wrong";
  if (summary.outcome === "needs_review") return "maybe";
  if (summary.outcome === "no_confirmed_drift") return "ok";
  return summary.unverified > 0 ? "unchecked" : "nothing_found";
}
