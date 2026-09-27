import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData, Satellite } from "../data.ts";
import { selectMapBlimps, selectMapSatellites } from "./mapSelection.ts";

function satellite(index: number): Satellite {
  return {
    repo: `team/repo-${index}`,
    stars: index + 1,
    topicCluster:
      ["Frameworks", "UI libraries", "Build tools", "Back end", "Other"][
        index % 5
      ] ?? "Other",
    readmeLagDays: index * 3,
    label: index % 7 === 0 ? "Possible drift" : "On course",
    driftDegrees: index % 7 === 0 ? 20 : 0,
    commitSha: "abcdef123456",
    scannedAt: "2026-09-26T00:00:00Z",
    tiersRun: ["static"],
    simulated: false,
  };
}

function blimp(index: number): AccountRepoData {
  return {
    repo: `owner/unscanned-${index}`,
    visibility: "public",
    canAdmin: true,
    description: null,
    language: null,
    updatedAt: null,
    archived: false,
    fork: false,
    connected: false,
    runtimeEnabled: false,
    checked: false,
    label: null,
    scanned: false,
  };
}

test("the map keeps every scanned repo at desktop and phone sizes", () => {
  const all = Array.from({ length: 500 }, (_, index) => satellite(index));
  const desktop = selectMapSatellites(all);
  const mobile = selectMapSatellites(all);
  assert.equal(desktop.length, 500);
  assert.equal(mobile.length, 500);
  assert.ok(desktop.some((item) => item.repo === "team/repo-249"));
  assert.ok(mobile.some((item) => item.repo === "team/repo-249"));
  assert.equal(new Set(desktop.map((item) => item.repo)).size, desktop.length);
  assert.deepEqual(selectMapSatellites(all), desktop);
});

test("the holding orbit keeps every unscanned repo at desktop and phone sizes", () => {
  const all = Array.from({ length: 500 }, (_, index) => blimp(index));
  const desktop = selectMapBlimps(all);
  const mobile = selectMapBlimps(all);
  assert.equal(desktop.length, 500);
  assert.equal(mobile.length, 500);
  assert.ok(desktop.some((item) => item.repo === "owner/unscanned-249"));
  assert.ok(mobile.some((item) => item.repo === "owner/unscanned-249"));
});
