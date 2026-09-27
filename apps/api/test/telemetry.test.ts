import { expect, test } from "bun:test";
import { MemoryStore } from "@ground-control/store";
import {
  ingestTelemetry,
  refreshTrust,
  telemetrySchema,
} from "../src/index.ts";

const firstResult = {
  claimId: "c_1111111111",
  sourceId: "readme",
  quote: "Run setup.sh",
  kind: "file_exists" as const,
  params: { path: "setup.sh" },
  status: "pass" as const,
  expected: "exists",
  actual: "exists",
};
const first = {
  repo: "owner/project",
  commitSha: "abcdef0",
  results: [firstResult],
};

test("first pass confirms; later failure blocks and groups repeated facts", () => {
  const store = new MemoryStore();
  store.putRepo({
    repo: "owner/project",
    visibility: "public",
    connected: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  const baseline = ingestTelemetry(
    store,
    first,
    new Date("2026-09-26T12:00:00Z"),
  );
  expect(baseline.results[0]?.state).toBe("confirmed");
  expect(baseline.verdict).toBe("success");
  expect(
    ingestTelemetry(store, first, new Date("2026-09-27T12:00:00Z")).id,
  ).toBe(baseline.id);
  const next = ingestTelemetry(
    store,
    {
      repo: first.repo,
      commitSha: "abcdef1",
      results: [
        { ...firstResult, status: "fail", actual: "missing" },
        {
          ...firstResult,
          claimId: "c_2222222222",
          sourceId: "wiki",
          status: "fail",
          actual: "missing",
        },
      ],
    },
    new Date("2026-09-27T12:00:00Z"),
  );
  expect(next.results[0]?.state).toBe("confirmed");
  expect(next.results[1]?.state).toBe("disputed");
  expect(next.verdict).toBe("failure");
  expect(next.evidence).toHaveLength(1);
  expect(next.evidence[0]?.claims).toHaveLength(1);
  const refreshed = refreshTrust(
    store,
    "owner/project",
    "c_2222222222",
    "confirmed",
  );
  expect(refreshed?.evidence[0]?.claims).toHaveLength(2);
  expect(store.getRepo("owner/project")?.driftDegrees).toBe(90);
});

test("telemetry accepts only a valid pull request number", () => {
  expect(
    telemetrySchema.safeParse({ ...first, pullRequestNumber: 42 }).success,
  ).toBe(true);
  for (const number of [0, -1, 1.5, 2_147_483_648, "42"])
    expect(
      telemetrySchema.safeParse({ ...first, pullRequestNumber: number })
        .success,
    ).toBe(false);
});
