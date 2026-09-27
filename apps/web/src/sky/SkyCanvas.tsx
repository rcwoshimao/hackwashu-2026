import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountRepoData, Satellite } from "../data.ts";
import { useArrivals, useCanvasRender, useVisibility } from "./canvasHooks.ts";
import { layoutBlimps, layoutSky, pickBlimp, pickSatellite } from "./layout.ts";
import { placePoint } from "./motion.ts";

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
          : Math.min(760, Math.max(520, Math.floor(width * 0.72)));
      setSize({ width, height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export function SkyCanvas({
  satellites,
  unscanned,
  selectedRepo,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const { width, height } = useCanvasSize(containerRef);
  const layout = useMemo(
    () => layoutSky(satellites, width, height),
    [satellites, width, height],
  );
  const blimps = useMemo(
    () => layoutBlimps(unscanned, layout),
    [unscanned, layout],
  );
  const arrivals = useArrivals(satellites);
  const visible = useVisibility(containerRef);
  useCanvasRender(
    canvasRef,
    layout,
    selectedRepo,
    reducedMotion,
    arrivals,
    visible,
    blimps,
  );

  const onPointerSelect = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) * width) / bounds.width;
    const y = ((event.clientY - bounds.top) * height) / bounds.height;
    const blimp = pickBlimp(blimps, x, y);
    if (blimp) onSelect(blimp.repo);
    else {
      const now = performance.now();
      const picked = pickSatellite(layout, x, y, (point) =>
        placePoint(layout, point, now, reducedMotion),
      );
      if (picked) onSelect(picked.repo);
    }
  };

  return (
    <div className="sky-canvas-wrap" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="sky-canvas"
        style={{ height }}
        onPointerDown={onPointerSelect}
        role="img"
        aria-label={copy.skyCanvasAlt}
      />
    </div>
  );
}
