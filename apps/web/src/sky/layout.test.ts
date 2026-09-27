import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData, Satellite } from "../data.ts";
import {
  layoutBlimps,
  layoutSky,
  pickBlimp,
  pickSatellite,
  topicKey,
} from "./layout.ts";

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

test("README lag uses a log scale so one outlier does not crowd the rest", () => {
  const lags = [0, 4, 25, 128, 2918];
  const layout = layoutSky(
    lags.map((lag, index) => ({
      ...satellite(index),
      readmeLagDays: lag,
    })),
    960,
    720,
  );
  const share = (index: number) => {
    const point = layout.points[index];
    assert.ok(point);
    return (
      (point.distance - layout.innerRadius) /
      (layout.outerRadius - layout.innerRadius)
    );
  };
  assert.equal(share(0), 0);
  assert.ok(Math.abs(share(4) - 1) < 1e-9);
  assert.ok(share(2) > 0.35);
  assert.ok(share(1) < share(2) && share(2) < share(3));
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

test("unscanned account marks stay in the holding orbit without invented scan metrics", () => {
  const repos: AccountRepoData[] = Array.from({ length: 500 }, (_, index) => ({
    repo: `owner/unscanned-${index}`,
    visibility: index % 2 === 0 ? "public" : "private",
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
  }));
  const layout = layoutSky([satellite(1)], 320, 340);
  const points = layoutBlimps(repos, layout);
  assert.equal(points.length, 500);
  assert.ok(
    points.every(
      (point) =>
        Math.hypot(point.x - layout.centerX, point.y - layout.centerY) >
        layout.outerRadius,
    ),
  );
  assert.ok(
    points.every(
      (point) =>
        point.x >= 0 && point.x <= 320 && point.y >= 0 && point.y <= 340,
    ),
  );
  const first = points[0];
  assert.ok(first);
  assert.equal(pickBlimp(points, first.x, first.y)?.repo, first.repo.repo);
});
