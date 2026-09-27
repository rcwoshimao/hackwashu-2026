import { z } from "zod";
import { apiTimeoutMs, fixTimeoutMs } from "./config.ts";
import {
  accountReposSchema,
  meSchema,
  repoSchema,
  runSchema,
  skySchema,
  sourceSchema,
  sourceSyncSchema,
} from "./data.ts";

export type ApiError = {
  code: "network" | "access" | "invalid" | "server";
  status?: number;
};
export type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError };

async function readJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(apiTimeoutMs)])
        : AbortSignal.timeout(apiTimeoutMs),
    });
  } catch {
    return { ok: false, error: { code: "network" } };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: {
        code:
          response.status === 401 || response.status === 403
            ? "access"
            : "server",
        status: response.status,
      },
    };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: { code: "invalid" } };
  }
  const parsed = schema.safeParse(body);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: { code: "invalid" } };
}

async function postJson<T>(
  url: string,
  body: unknown,
  schema: z.ZodType<T>,
  timeoutMs = apiTimeoutMs,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, error: { code: "network" } };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: {
        code:
          response.status === 401 || response.status === 403
            ? "access"
            : "server",
        status: response.status,
      },
    };
  }
  if (response.status === 204) return { ok: true, value: {} as T };
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    return { ok: false, error: { code: "invalid" } };
  }
  const parsed = schema.safeParse(value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: { code: "invalid" } };
}

const actionSchema = z.object({}).passthrough();
const scanSchema = z.object({
  state: z.enum(["queued", "cached"]),
  repo: z.string(),
  commitSha: z.string().optional(),
});
const connectSchema = z.discriminatedUnion("visibility", [
  z.object({
    repo: z.string(),
    visibility: z.literal("private"),
    runtimeEnabled: z.literal(true),
    telemetryToken: z.string().min(20),
  }),
  z.object({
    repo: z.string(),
    visibility: z.literal("public"),
    runtimeEnabled: z.boolean(),
    telemetryToken: z.string().min(20).optional(),
  }),
]);
export type Connection = z.infer<typeof connectSchema>;
const imessageLinkSchema = z.object({ status: z.literal("sent") });
const fixSchema = z.object({
  pullRequestUrl: z.string(),
  fixedClaimIds: z.array(z.string()),
  skippedClaimIds: z.array(z.string()),
});
export type FixResult = z.infer<typeof fixSchema>;

export const api = {
  sky: (signal?: AbortSignal) => readJson("/api/sky", skySchema, signal),
  cachedSky: (signal?: AbortSignal) => readJson("/sky.json", skySchema, signal),
  repo: (repo: string, signal?: AbortSignal) =>
    readJson(
      `/api/repos/${repo.split("/").map(encodeURIComponent).join("/")}`,
      repoSchema,
      signal,
    ),
  run: (id: string, signal?: AbortSignal) =>
    readJson(`/api/runs/${encodeURIComponent(id)}`, runSchema, signal),
  me: (signal?: AbortSignal) => readJson("/api/me", meSchema, signal),
  accountRepos: (signal?: AbortSignal) =>
    readJson("/api/account/repos", accountReposSchema, signal),
  scan: (repo: string) => postJson("/api/scan", { repo }, scanSchema),
  connect: (repo: string, runtime = false) =>
    postJson(
      "/api/connect",
      runtime ? { repo, runtime: true } : { repo },
      connectSchema,
    ),
  source: (repo: string, kind: string, url: string) =>
    postJson("/api/sources", { repo, kind, url }, sourceSchema),
  sourceStatus: (id: string) =>
    readJson(`/api/sources/${encodeURIComponent(id)}/status`, sourceSyncSchema),
  refreshSource: (id: string) =>
    postJson(
      `/api/sources/${encodeURIComponent(id)}/refresh`,
      {},
      sourceSyncSchema,
    ),
  imessageLink: (phone: string) =>
    postJson("/api/imessage/link", { phone }, imessageLinkSchema),
  confirm: (runId: string, claimId: string) =>
    postJson(
      `/api/runs/${encodeURIComponent(runId)}/claims/${encodeURIComponent(claimId)}/confirm`,
      {},
      actionSchema,
    ),
  drop: (runId: string, claimId: string) =>
    postJson(
      `/api/runs/${encodeURIComponent(runId)}/claims/${encodeURIComponent(claimId)}/drop`,
      {},
      actionSchema,
    ),
  restore: (runId: string, claimId: string) =>
    postJson(
      `/api/runs/${encodeURIComponent(runId)}/claims/${encodeURIComponent(claimId)}/restore`,
      {},
      actionSchema,
    ),
  fix: (runId: string, claimIds?: readonly string[]) =>
    postJson(
      `/api/runs/${encodeURIComponent(runId)}/fix`,
      claimIds ? { claimIds } : {},
      fixSchema,
      fixTimeoutMs,
    ),
  signout: () => postJson("/auth/signout", {}, actionSchema),
};
