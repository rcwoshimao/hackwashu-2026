import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Satellite } from "../data.ts";
import { layoutSky, pickSatellite, topicKey } from "./layout.ts";

function satellite(index: number): Satellite {
  return {
    repo: `team/repo-${index}`,
    stars: index + 1,
    topicCluster:
      ["frameworks", "UI libraries", "build tools", "back end", "other"][
        index % 5
      ] ?? "other",
    readmeLagDays: index,
    label: "On course",
    driftDegrees: 0,
    commitSha: "abcdef123456",
    scannedAt: "2026-09-26T00:00:00Z",
    tiersRun: ["static"],
    simulated: false,
  };
}

test("lays out 500 satellites deterministically within the Canvas", () => {
  const inputs = Array.from({ length: 500 }, (_, index) => satellite(index));
  const first = layoutSky(inputs, 960, 720);
  const second = layoutSky(inputs, 960, 720);
  assert.equal(first.points.length, 500);
  assert.deepEqual(first, second);
  assert.ok(
    first.points.every(
      (point) =>
        point.x >= 0 && point.x <= 960 && point.y >= 0 && point.y <= 720,
    ),
  );
  assert.equal(first.maxLagDays, 499);
});

test("topic labels map to the five documented sectors", () => {
  assert.deepEqual(
    ["frameworks", "UI libraries", "build tools", "back end", "unknown"].map(
      topicKey,
    ),
    ["frameworks", "ui", "build", "backend", "other"],
  );
});

test("pointer picking selects a nearby mark", () => {
  const layout = layoutSky([satellite(1)], 600, 600);
  const point = layout.points[0];
  assert.ok(point);
  assert.equal(pickSatellite(layout, point.x, point.y)?.repo, "team/repo-1");
  assert.equal(pickSatellite(layout, 0, 0), null);
});
