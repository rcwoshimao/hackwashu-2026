import { type RefObject, useEffect, useRef, useState } from "react";
import type { Satellite } from "../data.ts";
import { drawSky } from "./draw.ts";
import type { SkyLayout } from "./layout.ts";

export function useArrivals(
  satellites: Satellite[],
): RefObject<Map<string, number>> {
  const previous = useRef<Set<string> | null>(null);
  const arrivals = useRef(new Map<string, number>());
  useEffect(() => {
    const current = new Set(satellites.map((satellite) => satellite.repo));
    if (previous.current) {
      const now = performance.now();
      for (const repo of current)
        if (!previous.current.has(repo)) arrivals.current.set(repo, now);
    }
    previous.current = current;
  }, [satellites]);
  return arrivals;
}

export function useVisibility(ref: RefObject<HTMLDivElement | null>): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let intersecting = true;
    const sync = () =>
      setVisible(intersecting && document.visibilityState === "visible");
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            intersecting = entry?.isIntersecting ?? true;
            sync();
          });
    observer?.observe(element);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref]);
  return visible;
}

type DrawInput = {
  canvas: HTMLCanvasElement;
  layout: SkyLayout;
  width: number;
  height: number;
  selectedRepo: string | null;
  reducedMotion: boolean;
  arrivals: ReadonlyMap<string, number>;
};

function startDrawing(input: DrawInput): () => void {
  const context = input.canvas.getContext("2d");
  if (!context) return () => undefined;
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  input.canvas.width = Math.round(input.width * pixelRatio);
  input.canvas.height = Math.round(input.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  let frame = 0;
  const render = (timeMs: number) => {
    drawSky(
      context,
      input.layout,
      input.width,
      input.height,
      timeMs,
      input.selectedRepo,
      input.reducedMotion,
      input.arrivals,
    );
    if (!input.reducedMotion) frame = requestAnimationFrame(render);
  };
  render(performance.now());
  return () => cancelAnimationFrame(frame);
}

export function useCanvasRender(
  ref: RefObject<HTMLCanvasElement | null>,
  layout: SkyLayout,
  selectedRepo: string | null,
  reducedMotion: boolean,
  arrivals: RefObject<Map<string, number>>,
  visible: boolean,
): void {
  useEffect(() => {
    if (!ref.current || !visible) return;
    return startDrawing({
      canvas: ref.current,
      layout,
      width: layout.centerX * 2,
      height: layout.centerY * 2,
      selectedRepo,
      reducedMotion,
      arrivals: arrivals.current,
    });
  }, [ref, layout, selectedRepo, reducedMotion, arrivals, visible]);
}
