import { scaleLog } from "d3-scale";
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

type Slot = { start: number; span: number; spread: number };

function skySlots(satellites: Satellite[]): Map<string, Slot> {
  const sector = (Math.PI * 2) / topicKeys.length;
  const slots = new Map<string, Slot>();
  for (const [group, key] of topicKeys.entries()) {
    const items = satellites
      .filter((item) => topicKey(item.topicCluster) === key)
      .sort(
        (left, right) =>
          left.readmeLagDays - right.readmeLagDays ||
          left.repo.localeCompare(right.repo),
      );
    const sliceStart = -Math.PI / 2 + group * sector + 0.08;
    const slotWidth = (sector - 0.16) / Math.max(1, items.length);
    for (const [index, item] of items.entries()) {
      const span = slotWidth * 0.12;
      const center = sliceStart + (index + 0.5) * slotWidth;
      slots.set(item.repo, {
        start: center - span / 2,
        span,
        spread: stableFraction(item.repo),
      });
    }
  }
  return slots;
}

function skyPoint(
  satellite: Satellite,
  slot: Slot,
  center: { x: number; y: number },
  lagScale: (value: number) => number,
  starScale: (value: number) => number,
): SkyPoint {
  const angle = slot.start + slot.spread * slot.span;
  const distance = lagScale(Math.max(0, satellite.readmeLagDays) + 1);
  return {
    satellite,
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
    radius: starScale(Math.max(1, satellite.stars)),
    angle,
    distance,
    sectorStart: slot.start,
    sectorSpan: slot.span,
    spread: slot.spread,
  };
}

export function layoutSky(
  satellites: Satellite[],
  width: number,
  height: number,
  reference: Satellite[] = satellites,
): SkyLayout {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.max(
    0,
    Math.min(width, height) / 2 - (width < 540 ? 34 : 55),
  );
  const innerRadius = outerRadius * (width < 540 ? 0.42 : 0.32);
  const maxLagDays = Math.max(
    0,
    ...reference.map((satellite) => satellite.readmeLagDays),
  );
  const maxStars = Math.max(
    0,
    ...reference.map((satellite) => satellite.stars),
  );
  const lagScale = scaleLog()
    .domain([1, Math.max(2, maxLagDays + 1)])
    .range([innerRadius, outerRadius])
    .clamp(true);
  const starScale = scaleLog()
    .domain([1, Math.max(2, maxStars)])
    .range([3, width < 540 ? 6 : 8])
    .clamp(true);
  const slots = skySlots(satellites);
  const points = satellites.map((satellite): SkyPoint => {
    const slot = slots.get(satellite.repo);
    if (!slot) throw new Error("Missing Sky position");
    return skyPoint(
      satellite,
      slot,
      { x: centerX, y: centerY },
      lagScale,
      starScale,
    );
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
  return sorted.map((repo, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sorted.length;
    const distance = layout.outerRadius + 18;
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
