import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Satellite } from "../data.ts";
import { drawSky } from "./draw.ts";
import { layoutSky } from "./layout.ts";

function sample(label: string): Satellite {
  return {
    repo: "team/orbit",
    stars: 100,
    topicCluster: "other",
    readmeLagDays: 7,
    label,
    driftDegrees: 13,
    commitSha: "abcdef123456",
    scannedAt: "2026-09-26T00:00:00Z",
    tiersRun: ["static"],
    simulated: false,
  };
}

function fillOpacity(label: string, timeMs: number): number {
  const fills: number[] = [];
  const surface = {
    globalAlpha: 1,
    save() {},
    restore() {},
    fillRect() {},
    beginPath() {},
    arc() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    setLineDash() {},
    stroke() {},
    fill() {
      fills.push(surface.globalAlpha);
    },
  };
  const context = surface as unknown as CanvasRenderingContext2D;
  const layout = layoutSky([sample(label)], 600, 600);
  drawSky(context, layout, 600, 600, timeMs, null, false, new Map(), []);
  const opacity = fills[0];
  assert.ok(opacity !== undefined);
  return opacity;
}

test("measured dots keep steady brightness during map motion", () => {
  for (const label of ["On course", "Possible drift", "Drifting"]) {
    const opacities = Array.from({ length: 30 }, (_, index) =>
      fillOpacity(label, index * 100),
    );
    assert.ok(Math.max(...opacities) - Math.min(...opacities) < 0.05, label);
  }
});
