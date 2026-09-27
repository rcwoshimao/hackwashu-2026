import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { CheckResult, RunData } from "../data.ts";
import {
  checklist,
  claimVerdict,
  repoHeadline,
  summarizeRun,
} from "./findingSummary.ts";

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

const dropped: CheckResult = {
  claimId: "gone",
  state: "dropped",
  status: "fail",
  quote: "old claim",
  sourceId: "README.md",
  expected: "{}",
  actual: "fail",
};

test("the checklist puts problems first and leaves out dropped claims", () => {
  const items = checklist({
    ...run,
    results: [...run.results, dropped],
  });
  assert.deepEqual(
    items.map((item) => [item.result.claimId, item.verdict]),
    [
      ["review", "maybe"],
      ["unverified", "unchecked"],
      ["pass", "ok"],
    ],
  );
});

test("a confirmed failure reads as wrong, an unconfirmed one as maybe", () => {
  const [failure] = run.results.filter((item) => item.status === "fail");
  assert.ok(failure);
  assert.equal(claimVerdict(failure), "maybe");
  assert.equal(claimVerdict({ ...failure, state: "confirmed" }), "wrong");
});

test("the headline separates nothing found from nothing checkable", () => {
  assert.equal(
    repoHeadline(summarizeRun({ ...run, results: [] })),
    "nothing_found",
  );
  assert.equal(
    repoHeadline(
      summarizeRun({
        ...run,
        results: run.results.filter((item) => item.status === "unverified"),
      }),
    ),
    "unchecked",
  );
  assert.equal(repoHeadline(summarizeRun(run)), "maybe");
  assert.equal(
    repoHeadline(
      summarizeRun({
        ...run,
        results: run.results.filter((item) => item.status === "pass"),
      }),
    ),
    "ok",
  );
});
