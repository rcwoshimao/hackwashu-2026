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
