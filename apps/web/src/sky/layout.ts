import { scaleLinear, scaleLog } from "d3-scale";
import type { Satellite } from "../data.ts";

export const topicKeys = [
  "frameworks",
  "ui",
  "build",
  "backend",
  "other",
] as const;
export type TopicKey = (typeof topicKeys)[number];

export type SkyPoint = {
  satellite: Satellite;
  x: number;
  y: number;
  radius: number;
  angle: number;
  distance: number;
  sectorStart: number;
  sectorSpan: number;
  spread: number;
};
export type SkyLayout = {
  points: SkyPoint[];
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  maxLagDays: number;
  maxStars: number;
};

function stableFraction(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function topicKey(value: string): TopicKey {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("framework")) return "frameworks";
  if (normalized.includes("build") || normalized.includes("tool"))
    return "build";
  if (normalized.includes("back") || normalized.includes("server"))
    return "backend";
  if (normalized.includes("ui") || normalized.includes("frontend")) return "ui";
  return "other";
}

export function layoutSky(
  satellites: Satellite[],
  width: number,
  height: number,
): SkyLayout {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.max(
    0,
    Math.min(width, height) / 2 - (width < 540 ? 34 : 55),
  );
  const innerRadius = outerRadius * 0.18;
  const maxLagDays = Math.max(
    0,
    ...satellites.map((satellite) => satellite.readmeLagDays),
  );
  const maxStars = Math.max(
    0,
    ...satellites.map((satellite) => satellite.stars),
  );
  const lagScale = scaleLinear()
    .domain([0, Math.max(1, maxLagDays)])
    .range([innerRadius, outerRadius])
    .clamp(true);
  const starScale = scaleLog()
    .domain([1, Math.max(2, maxStars)])
    .range([3, width < 540 ? 7 : 11])
    .clamp(true);
  const sector = (Math.PI * 2) / topicKeys.length;
  const points = satellites.map((satellite): SkyPoint => {
    const group = topicKeys.indexOf(topicKey(satellite.topicCluster));
    const sectorStart = -Math.PI / 2 + group * sector + 0.08;
    const sectorSpan = sector - 0.16;
    const spread = stableFraction(satellite.repo);
    const angle = sectorStart + spread * sectorSpan;
    const distance = lagScale(satellite.readmeLagDays);
    return {
      satellite,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      radius: starScale(Math.max(1, satellite.stars)),
      angle,
      distance,
      sectorStart,
      sectorSpan,
      spread,
    };
  });
  return {
    points,
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    maxLagDays,
    maxStars,
  };
}

export function pickSatellite(
  layout: SkyLayout,
  x: number,
  y: number,
  place: (point: SkyPoint) => { x: number; y: number } = (point) => point,
): Satellite | null {
  let picked: SkyPoint | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const point of layout.points) {
    const at = place(point);
    const distance = Math.hypot(at.x - x, at.y - y);
    const hitRadius = Math.max(16, point.radius + 8);
    if (distance <= hitRadius && distance < best) {
      picked = point;
      best = distance;
    }
  }
  return picked?.satellite ?? null;
}
