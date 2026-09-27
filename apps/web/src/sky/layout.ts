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

type Slot = { start: number; span: number; spread: number; sizeFactor: number };

function topicBands(
  satellites: Satellite[],
  key: TopicKey,
  lagScale: (value: number) => number,
  innerRadius: number,
): Map<number, Satellite[]> {
  const bands = new Map<number, Satellite[]>();
  for (const item of satellites.filter(
    (satellite) => topicKey(satellite.topicCluster) === key,
  )) {
    const distance = lagScale(Math.max(0, item.readmeLagDays));
    const band = Math.floor((distance - innerRadius) / 20);
    const items = bands.get(band) ?? [];
    items.push(item);
    bands.set(band, items);
  }
  return bands;
}

function skySlots(
  satellites: Satellite[],
  lagScale: (value: number) => number,
  starScale: (value: number) => number,
  innerRadius: number,
): Map<string, Slot> {
  const sector = (Math.PI * 2) / topicKeys.length;
  const slots = new Map<string, Slot>();
  for (const [group, key] of topicKeys.entries()) {
    for (const [band, items] of topicBands(
      satellites,
      key,
      lagScale,
      innerRadius,
    )) {
      items.sort((left, right) => left.repo.localeCompare(right.repo));
      const sliceStart = -Math.PI / 2 + group * sector + 0.1;
      const slotWidth = (sector - 0.2) / items.length;
      const minDistance = innerRadius + band * 20;
      const maxRadius = Math.max(
        ...items.map((item) => starScale(Math.max(1, item.stars))),
      );
      const sizeFactor = Math.min(
        1,
        (slotWidth * minDistance - 2) / (2 * maxRadius),
      );
      for (const [index, item] of items.entries()) {
        const span = slotWidth * 0.08;
        const center = sliceStart + (index + 0.5) * slotWidth;
        slots.set(item.repo, {
          start: center - span / 2,
          span,
          spread: stableFraction(item.repo),
          sizeFactor: Math.max(0.15, sizeFactor),
        });
      }
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
  const distance = lagScale(Math.max(0, satellite.readmeLagDays));
  return {
    satellite,
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
    radius: starScale(Math.max(1, satellite.stars)) * slot.sizeFactor,
    angle,
    distance,
    sectorStart: slot.start,
    sectorSpan: slot.span,
    spread: slot.spread,
  };
}

function spacePointRadii(points: SkyPoint[]): SkyPoint[] {
  const radii = points.map((point) => point.radius);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let left = 0; left < points.length; left += 1) {
      const first = points[left];
      if (!first) continue;
      for (let right = left + 1; right < points.length; right += 1) {
        const second = points[right];
        if (!second) continue;
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const combined = (radii[left] ?? 0) + (radii[right] ?? 0);
        if (combined + 1 <= distance) continue;
        const factor = Math.max(0, (distance - 1) / combined);
        radii[left] = (radii[left] ?? 0) * factor;
        radii[right] = (radii[right] ?? 0) * factor;
      }
    }
  }
  return points.map((point, index) => ({
    ...point,
    radius: radii[index] ?? point.radius,
  }));
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
  const slots = skySlots(satellites, lagScale, starScale, innerRadius);
  const points = spacePointRadii(
    satellites.map((satellite): SkyPoint => {
      const slot = slots.get(satellite.repo);
      if (!slot) throw new Error("Missing Sky position");
      return skyPoint(
        satellite,
        slot,
        { x: centerX, y: centerY },
        lagScale,
        starScale,
      );
    }),
  );
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
  const ringCount = Math.min(4, Math.max(1, Math.ceil(sorted.length / 40)));
  const mobile = layout.centerX * 2 < 540;
  return sorted.map((repo, index) => {
    const ring = index % ringCount;
    const position = Math.floor(index / ringCount);
    const count = Math.ceil((sorted.length - ring) / ringCount);
    const angle = -Math.PI / 2 + ((position + 0.5) * Math.PI * 2) / count;
    const distance =
      layout.outerRadius + (mobile ? 5 + ring * 9 : 8 + ring * 12);
    const spacing = (Math.PI * 2 * distance) / count;
    return {
      repo,
      x: layout.centerX + Math.cos(angle) * distance,
      y: layout.centerY + Math.sin(angle) * distance,
      radius: Math.max(0.8, Math.min(3.5, (spacing - 2) / 2)),
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
