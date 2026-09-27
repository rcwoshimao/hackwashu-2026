import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountRepoData, Satellite } from "../data.ts";
import {
  type CanvasScene,
  useArrivals,
  useCanvasRender,
  useVisibility,
} from "./canvasHooks.ts";
import { layoutBlimps, layoutSky, pickBlimp, pickSatellite } from "./layout.ts";
import { selectMapBlimps, selectMapSatellites } from "./mapSelection.ts";
import { placePoint } from "./motion.ts";
import { useSkyView } from "./useSkyView.ts";
import { viewBlimps, viewLayout, zoomLevels } from "./view.ts";

type Props = {
  satellites: Satellite[];
  unscanned: AccountRepoData[];
  selectedRepo: string | null;
  onSelect: (repo: string) => void;
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useCanvasSize(ref: React.RefObject<HTMLDivElement | null>): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({ width: 720, height: 620 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => {
      const width = Math.max(280, Math.floor(element.clientWidth));
      const height =
        width < 540
          ? Math.max(340, Math.floor(width * 0.98))
          : Math.min(900, Math.max(560, Math.floor(width * 0.82)));
      setSize({ width, height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function ZoomControls({
  zoom,
  zoomIn,
  zoomOut,
}: {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
}) {
  return (
    <div className="sky-zoom">
      <button
        type="button"
        aria-label={copy.skyZoomIn}
        title={copy.skyZoomIn}
        disabled={zoom >= Math.max(...zoomLevels)}
        onClick={zoomIn}
      >
        +
      </button>
      <button
        type="button"
        className="sky-zoom-out"
        aria-label={copy.skyZoomOut}
        title={copy.skyZoomOut}
        disabled={zoom <= 1}
        onClick={zoomOut}
      >
        −
      </button>
    </div>
  );
}

function pickRepo(
  scene: CanvasScene,
  x: number,
  y: number,
  reducedMotion: boolean,
): string | null {
  const blimp = pickBlimp(scene.blimps, x, y);
  if (blimp) return blimp.repo;
  const now = performance.now();
  const picked = pickSatellite(scene.layout, x, y, (point) =>
    placePoint(scene.layout, point, now, reducedMotion),
  );
  return picked?.repo ?? null;
}

export function SkyCanvas({
  satellites,
  unscanned,
  selectedRepo,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CanvasScene | null>(null);
  const reducedMotion = useReducedMotion();
  const { width, height } = useCanvasSize(containerRef);
  const visibleSatellites = useMemo(
    () => selectMapSatellites(satellites),
    [satellites],
  );
  const visibleUnscanned = useMemo(
    () => selectMapBlimps(unscanned),
    [unscanned],
  );
  const layout = useMemo(
    () => layoutSky(visibleSatellites, width, height, satellites),
    [visibleSatellites, width, height, satellites],
  );
  const blimps = useMemo(
    () => layoutBlimps(visibleUnscanned, layout),
    [visibleUnscanned, layout],
  );
  const { view, zoomIn, zoomOut, handlers } = useSkyView(layout, (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) * width) / bounds.width;
    const y = ((event.clientY - bounds.top) * height) / bounds.height;
    const repo = sceneRef.current
      ? pickRepo(sceneRef.current, x, y, reducedMotion)
      : null;
    if (repo) onSelect(repo);
  });
  const scene = useMemo(
    () => ({
      layout: viewLayout(layout, view),
      blimps: viewBlimps(layout, view, blimps),
      width,
      height,
    }),
    [layout, view, blimps, width, height],
  );
  sceneRef.current = scene;
  const arrivals = useArrivals(visibleSatellites);
  const visible = useVisibility(containerRef);
  useCanvasRender(
    canvasRef,
    scene,
    selectedRepo,
    reducedMotion,
    arrivals,
    visible,
  );

  return (
    <div className="sky-canvas-wrap" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={view.zoom > 1 ? "sky-canvas zoomed" : "sky-canvas"}
        style={{ height }}
        {...handlers}
        role="img"
        aria-label={copy.skyCanvasAlt}
      />
      <ZoomControls zoom={view.zoom} zoomIn={zoomIn} zoomOut={zoomOut} />
      {view.zoom > 1 && <p className="sky-zoom-hint">{copy.skyZoomHint}</p>}
      <p className="sky-map-count">
        {`${copy.skyShowing} ${visibleSatellites.length + visibleUnscanned.length} ${copy.skyMapShown}. ${copy.skyMapBrowse}.`}
      </p>
      <p className="sky-map-guide">{copy.skyMapGuide}</p>
    </div>
  );
}
