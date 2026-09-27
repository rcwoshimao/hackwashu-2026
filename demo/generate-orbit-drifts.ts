import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Drift = { name: string; path: string; from: string; to: string };

const root = join(process.cwd(), "demo/orbit-app");
const drifts: Drift[] = [
  {
    name: "port-8080",
    path: "src/server.js",
    from: 'process.env.PORT ?? "3000"',
    to: 'process.env.PORT ?? "8080"',
  },
  {
    name: "port-9090",
    path: "src/server.js",
    from: 'process.env.PORT ?? "3000"',
    to: 'process.env.PORT ?? "9090"',
  },
  {
    name: "dev-renamed-serve",
    path: "package.json",
    from: '"dev": "node src/server.js"',
    to: '"serve": "node src/server.js"',
  },
  {
    name: "start-renamed-launch",
    path: "package.json",
    from: '"start": "node src/server.js"',
    to: '"launch": "node src/server.js"',
  },
  {
    name: "test-renamed-check",
    path: "package.json",
    from: '"test": "node --test test/app.test.js"',
    to: '"check": "node --test test/app.test.js"',
  },
  {
    name: "health-removed",
    path: "src/server.js",
    from: 'app.get("/api/health",',
    to: 'app.get("/api/status",',
  },
  {
    name: "health-shape",
    path: "src/server.js",
    from: 'status: "ok", version:',
    to: 'state: "ok", version:',
  },
  {
    name: "health-version-removed",
    path: "src/server.js",
    from: 'version: "1.0.0"',
    to: 'build: "1.0.0"',
  },
  {
    name: "planets-removed",
    path: "src/server.js",
    from: 'app.get("/api/planets",',
    to: 'app.get("/api/worlds",',
  },
  {
    name: "planets-shape",
    path: "src/server.js",
    from: "planets: listPlanets()",
    to: "worlds: listPlanets()",
  },
  {
    name: "env-renamed",
    path: "src/server.js",
    from: "process.env.ORBIT_GREETING",
    to: "process.env.ORBIT_MESSAGE",
  },
  {
    name: "port-env-renamed",
    path: "src/server.js",
    from: "process.env.PORT",
    to: "process.env.ORBIT_PORT",
  },
  {
    name: "env-example-deleted",
    path: ".env.example",
    from: "PORT=3000\nORBIT_GREETING=Welcome aboard\n",
    to: "",
  },
  {
    name: "man-page-deleted",
    path: "man/orbit.1",
    from: "DELETE_FILE",
    to: "",
  },
  {
    name: "catalog-renamed",
    path: "src/catalog.js",
    from: "listPlanets",
    to: "listWorlds",
  },
  {
    name: "app-export-renamed",
    path: "src/server.js",
    from: "export function createApp()",
    to: "export function buildApp()",
  },
  {
    name: "flag-renamed",
    path: "bin/orbit.js",
    from: "--format",
    to: "--output",
  },
  {
    name: "flag-help-hidden",
    path: "bin/orbit.js",
    from: "Usage: orbit --format json|table",
    to: "Usage: orbit [options]",
  },
  {
    name: "node-below-24",
    path: "package.json",
    from: '"node": ">=24"',
    to: '"node": "<24"',
  },
  {
    name: "lockfile-deleted",
    path: "package-lock.json",
    from: "DELETE_FILE",
    to: "",
  },
];

function hunk(path: string, before: string, after: string): string {
  const oldLines = before.trimEnd().split("\n");
  const newLines = after.trimEnd() ? after.trimEnd().split("\n") : [];
  let first = 0;
  while (first < oldLines.length && oldLines[first] === newLines[first])
    first += 1;
  let oldLast = oldLines.length;
  let newLast = newLines.length;
  while (
    oldLast > first &&
    newLast > first &&
    oldLines[oldLast - 1] === newLines[newLast - 1]
  ) {
    oldLast -= 1;
    newLast -= 1;
  }
  const start = Math.max(0, first - 3);
  const oldEnd = Math.min(oldLines.length, oldLast + 3);
  const newEnd = Math.min(newLines.length, newLast + 3);
  const removed = oldLines.slice(first, oldLast).map((line) => `-${line}`);
  const added = newLines.slice(first, newLast).map((line) => `+${line}`);
  const body = [
    ...oldLines.slice(start, first).map((line) => ` ${line}`),
    ...removed,
    ...added,
    ...oldLines.slice(oldLast, oldEnd).map((line) => ` ${line}`),
  ];
  const oldRange = `${start + 1},${oldEnd - start}`;
  const newRange = `${start + 1},${newEnd - start}`;
  const header = [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ ${newLines.length === 0 ? "/dev/null" : `b/${path}`}`,
    `@@ -${oldRange} +${newRange} @@`,
  ];
  return `${[...header, ...body].join("\n")}\n`;
}

const target = join(root, "drifts");
mkdirSync(target, { recursive: true });
for (const drift of drifts) {
  const original = readFileSync(join(root, drift.path), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
  const next =
    drift.from === "DELETE_FILE"
      ? ""
      : original.replaceAll(drift.from, drift.to);
  if (next === original)
    throw new Error(`Drift did not change ${drift.path}: ${drift.name}`);
  if (drift.from !== "DELETE_FILE" && !original.includes(drift.from))
    throw new Error(`Missing source text: ${drift.name}`);
  writeFileSync(
    join(target, `${drift.name}.patch`),
    hunk(drift.path, original, next),
  );
}
