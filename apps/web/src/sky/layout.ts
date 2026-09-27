import { scaleLog, scaleSymlog } from "d3-scale";
import type { AccountRepoData, Satellite } from "../data.ts";

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
export type BlimpPoint = {
  repo: AccountRepoData;
  x: number;
  y: number;
  radius: number;
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
  // README lag is long-tailed: one repo years behind would pin every other
  // mark to the inner ring on a linear scale.
  const lagScale = scaleSymlog()
    .domain([0, Math.max(1, maxLagDays)])
    .range([innerRadius, outerRadius])
    .clamp(true);
  const starScale = scaleLog()
    .domain([1, Math.max(2, maxStars)])
    .range([1.8, width < 540 ? 4.5 : 6.5])
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

export function layoutBlimps(
  repos: AccountRepoData[],
  layout: SkyLayout,
): BlimpPoint[] {
  const sorted = [...repos].sort((left, right) =>
    left.repo.localeCompare(right.repo),
  );
  const ringCount = 3;
  return sorted.map((repo, index) => {
    const ring = index % ringCount;
    const position = Math.floor(index / ringCount);
    const count = Math.ceil((sorted.length - ring) / ringCount);
    const angle = -Math.PI / 2 + (position * Math.PI * 2) / Math.max(1, count);
    const distance = layout.outerRadius + 9 + ring * 10;
    return {
      repo,
      x: layout.centerX + Math.cos(angle) * distance,
      y: layout.centerY + Math.sin(angle) * distance,
      radius: 3.5,
    };
  });
}

export function pickBlimp(
  points: BlimpPoint[],
  x: number,
  y: number,
): AccountRepoData | null {
  let nearest: BlimpPoint | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const next = Math.hypot(point.x - x, point.y - y);
    if (next < distance && next <= 10) {
      nearest = point;
      distance = next;
    }
  }
  return nearest?.repo ?? null;
}
