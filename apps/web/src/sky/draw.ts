import type { BlimpPoint, SkyLayout, SkyPoint } from "./layout.ts";
import { placePoint, skyTurn } from "./motion.ts";

const ink = "#F2F3ED";
const quiet = "#C2CFCA";
const rule = "#627982";
const drift = "#F2B84B";
const night = "#0D171B";

function drawGrid(
  context: CanvasRenderingContext2D,
  layout: SkyLayout,
  width: number,
  height: number,
  turn: number,
): void {
  context.fillStyle = night;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = rule;
  context.lineWidth = 1;
  context.globalAlpha = 0.28;
  for (const radius of [
    layout.innerRadius,
    (layout.innerRadius + layout.outerRadius) / 2,
    layout.outerRadius,
  ]) {
    context.beginPath();
    context.arc(layout.centerX, layout.centerY, radius, 0, Math.PI * 2);
    context.stroke();
  }
  for (let index = 0; index < 5; index += 1) {
    const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 5) + turn;
    context.beginPath();
    context.moveTo(layout.centerX, layout.centerY);
    context.lineTo(
      layout.centerX + Math.cos(angle) * layout.outerRadius,
      layout.centerY + Math.sin(angle) * layout.outerRadius,
    );
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawDiamond(context: CanvasRenderingContext2D, point: SkyPoint): void {
  const { x, y, radius } = point;
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius, y);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius, y);
  context.closePath();
  context.stroke();
}

function drawPoint(context: CanvasRenderingContext2D, point: SkyPoint): void {
  const { satellite, x, y, radius } = point;
  const status = satellite.label.toLowerCase();
  context.save();
  context.lineWidth = 1.5;
  context.strokeStyle =
    !satellite.simulated && status === "drifting" ? drift : quiet;
  context.fillStyle =
    !satellite.simulated && status === "drifting" ? drift : ink;
  if (satellite.simulated) {
    context.globalAlpha = 0.75;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  } else if (status === "lost signal") {
    drawDiamond(context, point);
  } else {
    context.shadowColor = status === "drifting" ? drift : ink;
    context.shadowBlur = status === "drifting" ? 3 : 2;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    if (status === "no telemetry") context.stroke();
    else context.fill();
    if (
      status === "corrected" ||
      status === "drifting" ||
      status === "possible drift"
    ) {
      if (status === "possible drift") context.strokeStyle = drift;
      context.setLineDash(status === "drifting" ? [3, 3] : []);
      context.beginPath();
      context.arc(x, y, radius + 3, 0, Math.PI * 2);
      context.stroke();
    }
  }
  context.restore();
}

export function drawSky(
  context: CanvasRenderingContext2D,
  layout: SkyLayout,
  width: number,
  height: number,
  timeMs: number,
  selectedRepo: string | null,
  reducedMotion: boolean,
  arrivals: ReadonlyMap<string, number>,
  blimps: BlimpPoint[],
): void {
  drawGrid(context, layout, width, height, reducedMotion ? 0 : skyTurn(timeMs));
  for (const point of blimps) {
    context.strokeStyle = point.repo.visibility === "private" ? rule : quiet;
    context.lineWidth = 1.4;
    context.beginPath();
    context.ellipse(
      point.x,
      point.y,
      point.radius + 2,
      point.radius,
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
    if (point.repo.repo === selectedRepo) {
      context.strokeStyle = ink;
      context.beginPath();
      context.arc(point.x, point.y, point.radius + 7, 0, Math.PI * 2);
      context.stroke();
    }
  }
  for (const resting of layout.points) {
    const point = {
      ...resting,
      ...placePoint(layout, resting, timeMs, reducedMotion),
    };
    drawPoint(context, point);
    if (point.satellite.repo === selectedRepo) {
      context.strokeStyle = ink;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(point.x, point.y, point.radius + 8, 0, Math.PI * 2);
      context.stroke();
    }
    const arrivedAt = arrivals.get(point.satellite.repo);
    if (arrivedAt !== undefined && !reducedMotion && timeMs - arrivedAt < 850) {
      context.globalAlpha = 1 - (timeMs - arrivedAt) / 850;
      context.strokeStyle = ink;
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        point.radius + 5 + (timeMs - arrivedAt) / 45,
        0,
        Math.PI * 2,
      );
      context.stroke();
      context.globalAlpha = 1;
    }
  }
}
