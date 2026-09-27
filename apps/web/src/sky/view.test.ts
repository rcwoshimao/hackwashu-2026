import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData, Satellite } from "../data.ts";
import { layoutBlimps, layoutSky } from "./layout.ts";
import { placePoint } from "./motion.ts";
import {
  homeView,
  markScale,
  panView,
  stepZoom,
  viewBlimps,
  viewLayout,
} from "./view.ts";

function satellite(index: number): Satellite {
  return {
    repo: `team/repo-${index}`,
    stars: 100 + index,
    topicCluster: "frameworks",
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
  Array.from({ length: 12 }, (_, index) => satellite(index)),
  800,
  600,
);

test("zoom steps up and down through the fixed levels", () => {
  const twice = stepZoom(layout, stepZoom(layout, homeView, 1), 1);
  assert.equal(twice.zoom, 2);
  assert.equal(stepZoom(layout, twice, -1).zoom, 1.5);
  assert.equal(stepZoom(layout, homeView, -1).zoom, 1);
});

test("panning is disabled at home zoom and bounded when zoomed", () => {
  assert.deepEqual(panView(layout, homeView, 50, -50), homeView);
  const zoomed = { zoom: 2, offsetX: 0, offsetY: 0 };
  const far = panView(layout, zoomed, 10_000, -10_000);
  assert.equal(far.offsetX, layout.outerRadius);
  assert.equal(far.offsetY, -layout.outerRadius);
});

test("zooming out to home recentres the chart", () => {
  const view = { zoom: 1.5, offsetX: 40, offsetY: -30 };
  const home = stepZoom(layout, view, -1);
  assert.equal(home.zoom, 1);
  assert.equal(home.offsetX, 0);
  assert.equal(home.offsetY, 0);
});

test("the home view leaves the layout untouched", () => {
  assert.equal(viewLayout(layout, homeView), layout);
});

test("zoom spreads points from the centre and keeps their angle", () => {
  const view = { zoom: 2, offsetX: 0, offsetY: 0 };
  const zoomed = viewLayout(layout, view);
  for (const [index, point] of layout.points.entries()) {
    const next = zoomed.points[index];
    assert.ok(next);
    const before = placePoint(layout, point, 5_000, false);
    const after = placePoint(zoomed, next, 5_000, false);
    assert.ok(
      Math.abs(after.x - layout.centerX - 2 * (before.x - layout.centerX)) <
        1e-6,
    );
    assert.ok(Math.abs(next.radius - point.radius * markScale(2)) < 1e-9);
  }
});

test("blimps move with the chart", () => {
  const repo: AccountRepoData = {
    repo: "team/unscanned",
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
  const blimps = layoutBlimps([repo], layout);
  const view = { zoom: 2, offsetX: 10, offsetY: 0 };
  const [moved] = viewBlimps(layout, view, blimps);
  const [start] = blimps;
  assert.ok(moved && start);
  assert.equal(moved.x, layout.centerX + (start.x - layout.centerX) * 2 + 10);
});
