import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  maxTelemetryBytes,
  reportAttempts,
  reportRetryDelayMs,
  reportTimeoutMs,
} from "./limits.ts";
import { type ReportIdentity, validReportIdentity } from "./report-context.ts";
import type { Telemetry } from "./types.ts";

export type ReportResult =
  | { ok: true; kind: "sent" | "skipped" }
  | {
      ok: false;
      error:
        | "invalid_server"
        | "invalid_context"
        | "invalid_telemetry"
        | "identity_mismatch"
        | "network"
        | "server_rejected";
      status?: number;
    };

function readTelemetry(root: string): Telemetry | null {
  try {
    const path = join(root, ".groundcontrol/telemetry.json");
    if (statSync(path).size > maxTelemetryBytes) return null;
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (
      typeof value !== "object" ||
      value === null ||
      !("repo" in value) ||
      !("commitSha" in value) ||
      !("results" in value)
    )
      return null;
    if (
      typeof value.repo !== "string" ||
      typeof value.commitSha !== "string" ||
      !Array.isArray(value.results)
    )
      return null;
    return value as Telemetry;
  } catch {
    return null;
  }
}

function telemetryEndpoint(server: string): URL | null {
  try {
    const base = new URL(server);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && local))
      return null;
    if (base.username || base.password || base.search || base.hash) return null;
    return new URL("/api/telemetry", base);
  } catch {
    return null;
  }
}

async function sendOnce(
  endpoint: URL,
  token: string,
  body: string,
  transport: typeof fetch,
): Promise<ReportResult> {
  try {
    const response = await transport(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(reportTimeoutMs),
    });
    if (response.ok) return { ok: true, kind: "sent" };
    return { ok: false, error: "server_rejected", status: response.status };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function reportTelemetry(
  root: string,
  server: string,
  token: string,
  identity: ReportIdentity | null,
  transport: typeof fetch = fetch,
): Promise<ReportResult> {
  if (!server || !token) return { ok: true, kind: "skipped" };
  const endpoint = telemetryEndpoint(server);
  if (!endpoint) return { ok: false, error: "invalid_server" };
  if (!validReportIdentity(identity))
    return { ok: false, error: "invalid_context" };
  const telemetry = readTelemetry(root);
  if (!telemetry) return { ok: false, error: "invalid_telemetry" };
  if (
    telemetry.repo !== identity.repo ||
    telemetry.commitSha !== identity.commitSha ||
    telemetry.pullRequestNumber !== identity.pullRequestNumber
  )
    return { ok: false, error: "identity_mismatch" };
  const body = JSON.stringify(telemetry);
  let last: ReportResult = { ok: false, error: "network" };
  for (let attempt = 1; attempt <= reportAttempts; attempt += 1) {
    const result = await sendOnce(endpoint, token, body, transport);
    last = result;
    if (
      result.ok ||
      (result.error === "server_rejected" && (result.status ?? 0) < 500)
    )
      return result;
    if (attempt < reportAttempts)
      await new Promise((resolve) => setTimeout(resolve, reportRetryDelayMs));
  }
  return last;
}
