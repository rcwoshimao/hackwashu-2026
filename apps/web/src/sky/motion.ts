import type { SkyLayout, SkyPoint } from "./layout.ts";

export const skyTurnPeriodMs = 300_000;
export const outerGlidePeriodMs = 120_000;
export const innerGlideFloorMs = 20_000;

export type Placement = { x: number; y: number };

/** The whole chart turns together, so each topic keeps its relative slice. */
export function skyTurn(timeMs: number): number {
  return ((timeMs % skyTurnPeriodMs) / skyTurnPeriodMs) * Math.PI * 2;
}

/** Kepler's third law: the period grows with distance^1.5, so inner moons glide faster. */
export function glidePeriodMs(layout: SkyLayout, point: SkyPoint): number {
  const ratio = point.distance / Math.max(1, layout.outerRadius);
  return Math.max(innerGlideFloorMs, outerGlidePeriodMs * ratio ** 1.5);
}

/**
 * Position within the topic slice, from 0 to 1. The cosine makes the glide ease
 * at the slice edges, and the phase starts where the static layout placed it.
 */
export function glideFraction(
  spread: number,
  timeMs: number,
  periodMs: number,
): number {
  const startPhase = Math.acos(1 - 2 * spread) / (2 * Math.PI);
  const phase = startPhase + timeMs / periodMs;
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2;
}

/**
 * Only the angle moves. Distance encodes README lag and is never animated, and
 * the angle stays inside the moon's topic slice.
 */
export function placePoint(
  layout: SkyLayout,
  point: SkyPoint,
  timeMs: number,
  reducedMotion: boolean,
): Placement {
  if (reducedMotion) return { x: point.x, y: point.y };
  const fraction = glideFraction(
    point.spread,
    timeMs,
    glidePeriodMs(layout, point),
  );
  const angle =
    point.sectorStart + fraction * point.sectorSpan + skyTurn(timeMs);
  return {
    x: layout.centerX + Math.cos(angle) * point.distance,
    y: layout.centerY + Math.sin(angle) * point.distance,
  };
}
