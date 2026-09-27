import { Hono } from "hono";
import { registerAuthRoutes } from "./routes-auth.ts";
import { registerReadRoutes } from "./routes-read.ts";
import { registerWriteRoutes } from "./routes-write.ts";
import type { ApiDeps } from "./types.ts";
import { registerWebRoutes } from "./web.ts";

export function createApi(deps: ApiDeps): Hono {
  const app = new Hono();
  registerAuthRoutes(app, deps);
  registerReadRoutes(app, deps);
  registerWriteRoutes(app, deps);
  if (deps.webDist !== undefined) registerWebRoutes(app, deps.webDist);
  return app;
}

export { seedLocalDemo } from "./seed.ts";
export { GitHubCommitStatus } from "./status.ts";
export { ingestTelemetry, refreshTrust, telemetrySchema } from "./telemetry.ts";
export type {
  ApiDeps,
  CommitStatusPort,
  PublicScanPort,
  ScanResult,
} from "./types.ts";
export { EventHub } from "./types.ts";
