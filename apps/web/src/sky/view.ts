import type { BlimpPoint, SkyLayout } from "./layout.ts";

export const zoomLevels = [1, 1.5, 2, 3, 4] as const;

export type SkyView = { zoom: number; offsetX: number; offsetY: number };

export const homeView: SkyView = { zoom: 1, offsetX: 0, offsetY: 0 };

/**
 * Marks shrink as the chart grows, so each zoom step opens more space between
 * neighbours instead of letting them overlap again.
 */
export function markScale(zoom: number): number {
  return zoom ** -0.3;
}

function clampOffset(layout: SkyLayout, zoom: number, offset: number): number {
  const limit = layout.outerRadius * (zoom - 1);
  if (limit <= 0) return 0;
  return Math.max(-limit, Math.min(limit, offset));
}

export function panView(
  layout: SkyLayout,
  view: SkyView,
  deltaX: number,
  deltaY: number,
): SkyView {
  return {
    zoom: view.zoom,
    offsetX: clampOffset(layout, view.zoom, view.offsetX + deltaX),
    offsetY: clampOffset(layout, view.zoom, view.offsetY + deltaY),
  };
}

/** Steps through `zoomLevels`, keeping the point under the view centre fixed. */
export function stepZoom(
  layout: SkyLayout,
  view: SkyView,
  direction: 1 | -1,
): SkyView {
  const index = zoomLevels.findIndex((level) => level >= view.zoom);
  const next =
    zoomLevels[
      Math.max(0, Math.min(zoomLevels.length - 1, index + direction))
    ] ?? 1;
  const ratio = next / view.zoom;
  return {
    zoom: next,
    offsetX: clampOffset(layout, next, view.offsetX * ratio),
    offsetY: clampOffset(layout, next, view.offsetY * ratio),
  };
}

function project(layout: SkyLayout, view: SkyView, x: number, y: number) {
  return {
    x: layout.centerX + (x - layout.centerX) * view.zoom + view.offsetX,
    y: layout.centerY + (y - layout.centerY) * view.zoom + view.offsetY,
  };
}

/**
 * Returns the layout as it appears on screen. Distances scale with the zoom and
 * the angles are untouched, so the glide motion keeps the same shape.
 */
export function viewLayout(layout: SkyLayout, view: SkyView): SkyLayout {
  if (view.zoom === 1 && view.offsetX === 0 && view.offsetY === 0)
    return layout;
  const marks = markScale(view.zoom);
  return {
    ...layout,
    centerX: layout.centerX + view.offsetX,
    centerY: layout.centerY + view.offsetY,
    innerRadius: layout.innerRadius * view.zoom,
    outerRadius: layout.outerRadius * view.zoom,
    points: layout.points.map((point) => ({
      ...point,
      ...project(layout, view, point.x, point.y),
      distance: point.distance * view.zoom,
      radius: point.radius * marks,
    })),
  };
}

export function viewBlimps(
  layout: SkyLayout,
  view: SkyView,
  blimps: BlimpPoint[],
): BlimpPoint[] {
  if (view.zoom === 1 && view.offsetX === 0 && view.offsetY === 0)
    return blimps;
  const marks = markScale(view.zoom);
  return blimps.map((point) => ({
    ...point,
    ...project(layout, view, point.x, point.y),
    radius: point.radius * marks,
  }));
}
