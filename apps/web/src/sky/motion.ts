import {
  type SkyLayout,
  type SkyPoint,
  topicKey,
  topicKeys,
} from "./layout.ts";

export const skyTurnPeriodMs = 600_000;
export const outerGlidePeriodMs = 300_000;
export const innerGlideFloorMs = 60_000;
export const outerSwayPeriodMs = 90_000;
export const innerSwayFloorMs = 25_000;
/** The widest swing any mark gets, for marks in the middle of a topic. */
export const swayAmplitudeRadians = 0.35;
const topicEdgeMarginRadians = 0.02;

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
 * Each mark's own sway period: inner marks swing faster (Kepler again), and a
 * stable per-repo factor of 0.85 to 1.15 keeps neighbours out of step.
 */
export function swayPeriodMs(layout: SkyLayout, point: SkyPoint): number {
  const ratio = point.distance / Math.max(1, layout.outerRadius);
  const base = Math.max(innerSwayFloorMs, outerSwayPeriodMs * ratio ** 1.5);
  return base * (0.85 + 0.3 * point.spread);
}

/**
 * How far this mark may swing: up to `swayAmplitudeRadians`, less near a topic
 * edge, so the swing never carries a mark into the next topic's slice.
 */
export function swayAmplitude(point: SkyPoint): number {
  const sector = (Math.PI * 2) / topicKeys.length;
  const group = topicKeys.indexOf(topicKey(point.satellite.topicCluster));
  const topicStart = -Math.PI / 2 + group * sector;
  const center = point.sectorStart + point.sectorSpan / 2;
  const room = Math.min(center - topicStart, topicStart + sector - center);
  const reach = room - point.sectorSpan / 2 - topicEdgeMarginRadians;
  return Math.max(0, Math.min(swayAmplitudeRadians, reach));
}

/**
 * A bounded swing around the mark's slot, so marks never leave their topic.
 * Each mark starts at its own stable point in the swing, so the map opens
 * already scattered instead of every mark leaving its slot in step.
 */
export function swayAngle(
  layout: SkyLayout,
  point: SkyPoint,
  timeMs: number,
): number {
  const startPhase = (point.spread * 5.17) % 1;
  const phase = startPhase + timeMs / swayPeriodMs(layout, point);
  return swayAmplitude(point) * Math.sin(phase * 2 * Math.PI);
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
    point.sectorStart +
    fraction * point.sectorSpan +
    swayAngle(layout, point, timeMs) +
    skyTurn(timeMs);
  return {
    x: layout.centerX + Math.cos(angle) * point.distance,
    y: layout.centerY + Math.sin(angle) * point.distance,
  };
}
