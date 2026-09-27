import { type PointerEvent, useRef, useState } from "react";
import type { SkyLayout } from "./layout.ts";
import { homeView, panView, type SkyView, stepZoom } from "./view.ts";

const dragThresholdPx = 4;

type Drag = { x: number; y: number; start: SkyView; moved: boolean };

type Handlers = {
  onPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerCancel: () => void;
};

export type SkyViewControls = {
  view: SkyView;
  zoomIn: () => void;
  zoomOut: () => void;
  handlers: Handlers;
};

/**
 * Zoom comes only from the buttons, so page scrolling never gets captured by
 * the chart. Dragging pans once zoomed; a press without movement still selects.
 */
export function useSkyView(
  layout: SkyLayout,
  onTap: (event: PointerEvent<HTMLCanvasElement>) => void,
): SkyViewControls {
  const [view, setView] = useState<SkyView>(homeView);
  const drag = useRef<Drag | null>(null);
  const handlers: Handlers = {
    onPointerDown: (event) => {
      drag.current = {
        x: event.clientX,
        y: event.clientY,
        start: view,
        moved: false,
      };
      if (view.zoom > 1) event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      const current = drag.current;
      if (!current || view.zoom === 1) return;
      const deltaX = event.clientX - current.x;
      const deltaY = event.clientY - current.y;
      if (!current.moved && Math.hypot(deltaX, deltaY) < dragThresholdPx)
        return;
      current.moved = true;
      setView(panView(layout, current.start, deltaX, deltaY));
    },
    onPointerUp: (event) => {
      if (drag.current && !drag.current.moved) onTap(event);
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
  };
  return {
    view,
    zoomIn: () => setView((current) => stepZoom(layout, current, 1)),
    zoomOut: () => setView((current) => stepZoom(layout, current, -1)),
    handlers,
  };
}
