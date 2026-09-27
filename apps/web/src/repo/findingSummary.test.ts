import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { RunData } from "../data.ts";
import { summarizeRun } from "./findingSummary.ts";

const run: RunData = {
  id: "run-1",
  repo: "owner/project",
  commitSha: "abcdef",
  createdAt: "2026-09-26T00:00:00Z",
  verdict: "success",
  evidence: [],
  results: [
    {
      claimId: "pass",
      state: "confirmed",
      status: "pass",
      quote: "npm test",
      sourceId: "README.md",
      expected: "{}",
      actual: "pass",
    },
    {
      claimId: "review",
      state: "disputed",
      status: "fail",
      kind: "file_exists",
      quote: "build.zip",
      sourceId: "README.md",
      expected: '{"path":"build.zip"}',
      actual: "fail",
    },
    {
      claimId: "unverified",
      state: "unconfirmed",
      status: "unverified",
      quote: "Run npm start",
      sourceId: "README.md",
      expected: "{}",
      actual: "unverified",
    },
  ],
};

test("an unconfirmed failure is a review item, not a confirmed failure", () => {
  const summary = summarizeRun(run);
  assert.equal(summary.passed, 1);
  assert.equal(summary.needsReview, 1);
  assert.equal(summary.confirmedFailures, 0);
  assert.equal(summary.unverified, 1);
  assert.equal(summary.reviewItems[0]?.quote, "build.zip");
  assert.equal(summary.outcome, "needs_review");
});

test("a confirmed failure is separated from first-scan review items", () => {
  const summary = summarizeRun({
    ...run,
    results: run.results.map((item) =>
      item.claimId === "review" ? { ...item, state: "confirmed" } : item,
    ),
  });
  assert.equal(summary.confirmedFailures, 1);
  assert.equal(summary.needsReview, 0);
  assert.equal(summary.outcome, "confirmed_drift");
});

test("only unverified checks do not claim an on-course verdict", () => {
  const summary = summarizeRun({
    ...run,
    results: run.results.filter((item) => item.status === "unverified"),
  });
  assert.equal(summary.outcome, "unverified");
});
