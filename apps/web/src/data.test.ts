import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  confirmedDriftDegrees,
  measuredFindings,
  type RunData,
  type Satellite,
} from "./data.ts";
import { statusView } from "./presentation.ts";

function satellite(
  repo: string,
  lag: number,
  label: string,
  simulated = false,
): Satellite {
  return {
    repo,
    stars: 100,
    topicCluster: "other",
    readmeLagDays: lag,
    label,
    driftDegrees: label === "drifting" ? 45 : 0,
    commitSha: "abc123",
    scannedAt: "2026-09-26T00:00:00Z",
    tiersRun: ["static"],
    simulated,
  };
}

test("findings exclude simulated entries and do not count possible drift as confirmed drift", () => {
  const findings = measuredFindings([
    satellite("a/one", 2, "on course"),
    satellite("a/two", 10, "drifting"),
    satellite("a/three", 50, "possible drift"),
    satellite("fake/star", 999, "drifting", true),
  ]);
  assert.deepEqual(findings, {
    realCount: 3,
    driftingCount: 1,
    medianLagDays: 10,
  });
  assert.deepEqual(
    measuredFindings([satellite("fake/star", 999, "drifting", true)]),
    { realCount: 0, driftingCount: 0, medianLagDays: null },
  );
});

test("trajectory angles use only confirmed pass and fail results", () => {
  const run: RunData = {
    id: "r1",
    repo: "a/one",
    commitSha: "abc123",
    createdAt: "2026-09-26T00:00:00Z",
    verdict: "failure",
    evidence: [],
    results: [
      {
        claimId: "1",
        state: "confirmed",
        status: "pass",
        quote: "a",
        sourceId: "README.md",
        expected: "yes",
        actual: "yes",
      },
      {
        claimId: "2",
        state: "confirmed",
        status: "fail",
        quote: "b",
        sourceId: "README.md",
        expected: "yes",
        actual: "no",
      },
      {
        claimId: "3",
        state: "unconfirmed",
        status: "fail",
        quote: "c",
        sourceId: "README.md",
        expected: "yes",
        actual: "no",
      },
    ],
  };
  assert.equal(confirmedDriftDegrees(run), 45);
  assert.equal(
    confirmedDriftDegrees({ ...run, results: run.results.slice(2) }),
    null,
  );
});

test("possible drift has a neutral status presentation", () => {
  const view = statusView("Possible drift");
  assert.equal(view.text, "Possible drift");
  assert.equal(view.className, "possible-drift");
});
