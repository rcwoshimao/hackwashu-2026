import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Satellite } from "../data.ts";
import { layoutSky, topicKey, topicKeys } from "./layout.ts";
import {
  glidePeriodMs,
  placePoint,
  skyTurn,
  swayAmplitudeRadians,
  swayAngle,
  swayPeriodMs,
} from "./motion.ts";

function satellite(index: number): Satellite {
  return {
    repo: `team/repo-${index}`,
    stars: 100 + index,
    topicCluster: ["frameworks", "UI libraries", "build tools", "back end"][
      index % 4
    ] as string,
    readmeLagDays: index * 3,
    label: "On course",
    driftDegrees: 0,
    commitSha: "abcdef123456",
    scannedAt: "2026-09-26T00:00:00Z",
    tiersRun: ["static"],
    simulated: false,
  };
}

const layout = layoutSky(
  Array.from({ length: 60 }, (_, index) => satellite(index)),
  960,
  720,
);
const times = [0, 1_234, 45_000, 170_000, 999_999];

function wrap(angle: number): number {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

test("reduced motion keeps every moon at its resting position", () => {
  for (const point of layout.points)
    assert.deepEqual(placePoint(layout, point, 90_000, true), {
      x: point.x,
      y: point.y,
    });
});

test("at time zero the moving sky matches the resting layout", () => {
  for (const point of layout.points) {
    const placed = placePoint(layout, point, 0, false);
    assert.ok(Math.abs(placed.x - point.x) < 1e-6);
    assert.ok(Math.abs(placed.y - point.y) < 1e-6);
  }
});

test("moons never change distance, which encodes README lag", () => {
  for (const time of times)
    for (const point of layout.points) {
      const placed = placePoint(layout, point, time, false);
      const distance = Math.hypot(
        placed.x - layout.centerX,
        placed.y - layout.centerY,
      );
      assert.ok(Math.abs(distance - point.distance) < 1e-6);
    }
});

test("moons sway only a bounded amount around their slot", () => {
  for (const time of times)
    for (const point of layout.points) {
      const placed = placePoint(layout, point, time, false);
      const angle = Math.atan2(
        placed.y - layout.centerY,
        placed.x - layout.centerX,
      );
      const offset = wrap(
        angle - skyTurn(time) - point.sectorStart + swayAmplitudeRadians,
      );
      assert.ok(
        offset <= point.sectorSpan + 2 * swayAmplitudeRadians + 1e-9,
        `${point.satellite.repo}`,
      );
    }
});

test("inner moons glide faster than outer moons", () => {
  const sorted = [...layout.points].sort(
    (left, right) => left.distance - right.distance,
  );
  const inner = sorted.find((point) => point.distance > layout.innerRadius * 2);
  const outer = sorted.at(-1);
  assert.ok(inner && outer);
  assert.ok(glidePeriodMs(layout, inner) < glidePeriodMs(layout, outer));
});

test("marks sway at different speeds, inner ones faster", () => {
  const sorted = [...layout.points].sort(
    (left, right) => left.distance - right.distance,
  );
  const inner = sorted.find((point) => point.distance > layout.innerRadius * 2);
  const outer = sorted.at(-1);
  assert.ok(inner && outer);
  assert.ok(swayPeriodMs(layout, inner) < swayPeriodMs(layout, outer));
  const periods = new Set(
    layout.points.map((point) => Math.round(swayPeriodMs(layout, point))),
  );
  assert.ok(periods.size > layout.points.length / 2);
});

test("sway never exceeds its amplitude", () => {
  for (const time of times)
    for (const point of layout.points)
      assert.ok(
        Math.abs(swayAngle(layout, point, time)) <=
          swayAmplitudeRadians + 1e-12,
      );
});

test("swaying marks never leave their topic's slice of the map", () => {
  const sector = (Math.PI * 2) / topicKeys.length;
  for (const time of times)
    for (const point of layout.points) {
      const placed = placePoint(layout, point, time, false);
      const angle = Math.atan2(
        placed.y - layout.centerY,
        placed.x - layout.centerX,
      );
      const group = topicKeys.indexOf(topicKey(point.satellite.topicCluster));
      const offset = wrap(angle - skyTurn(time) + Math.PI / 2 - group * sector);
      assert.ok(offset <= sector, `${point.satellite.repo}`);
    }
});
