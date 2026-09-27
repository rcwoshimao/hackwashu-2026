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

test("a month of README lag stays visibly outside the inner orbit", () => {
  const near = { ...satellite(1), readmeLagDays: 30 };
  const far = { ...satellite(2), readmeLagDays: 2_918 };
  const layout = layoutSky([near, far], 960, 720);
  const point = layout.points.find((item) => item.satellite.repo === near.repo);
  assert.ok(point);
  assert.ok(
    point.distance >
      layout.innerRadius + (layout.outerRadius - layout.innerRadius) * 0.3,
  );
});

test("four marks with the same topic and lag have separate positions", () => {
  const inputs = Array.from({ length: 4 }, (_, index) => ({
    ...satellite(index),
    topicCluster: "TypeScript",
    readmeLagDays: 0,
    stars: 250_000,
  }));
  const points = layoutSky(inputs, 960, 720).points;
  for (const [index, point] of points.entries())
    for (const other of points.slice(index + 1))
      assert.ok(
        Math.hypot(point.x - other.x, point.y - other.y) >
          point.radius + other.radius + 4,
      );
});

test("54 measured repos remain distinct even when several share low lag", () => {
  const inputs = Array.from({ length: 54 }, (_, index) => ({
    ...satellite(index),
    topicCluster: ["UI libraries", "TypeScript", "Other"][index % 3] ?? "Other",
    readmeLagDays: index < 12 ? 0 : Math.floor((index - 12) ** 1.7),
    stars: 10 ** (index % 6),
  }));
  for (const [width, height] of [
    [960, 720],
    [320, 340],
  ] as const) {
    const points = layoutSky(inputs, width, height).points;
    assert.equal(points.length, 54);
    for (const [index, point] of points.entries())
      for (const other of points.slice(index + 1))
        assert.ok(
          Math.hypot(point.x - other.x, point.y - other.y) >=
            point.radius + other.radius + 1,
          `${point.satellite.repo} overlaps ${other.satellite.repo} at ${width}px`,
        );
  }
});

test("changing displayed marks does not change the lag scale", () => {
  const near = { ...satellite(1), readmeLagDays: 30 };
  const zero = { ...satellite(2), readmeLagDays: 0 };
  const far = { ...satellite(3), readmeLagDays: 2_918 };
  const reference = [near, zero, far];
  const first = layoutSky([near, zero], 960, 720, reference);
  const second = layoutSky([near, far], 960, 720, reference);
  assert.equal(first.points[0]?.distance, second.points[0]?.distance);
});
