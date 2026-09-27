import type { z } from "zod";
import { publicUrl, requestTimeoutMs, retryDelayMs } from "./config.ts";
import {
  actionSchema,
  meSchema,
  pageClaimsSchema,
  repoSchema,
} from "./protocol.ts";

export type ApiError = "network" | "server" | "access" | "invalid";
export type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError; status?: number };

export type ApiPorts = {
  baseUrl: string;
  fetcher: (url: string, init: RequestInit) => Promise<Response>;
  readToken: () => Promise<string | null>;
  delay: (ms: number) => Promise<void>;
};

type Method = "GET" | "POST";

async function fetchOnce<T>(
  ports: ApiPorts,
  path: string,
  method: Method,
  body: unknown,
  schema: z.ZodType<T>,
): Promise<ApiResult<T>> {
  let token: string | null;
  try {
    token = await ports.readToken();
  } catch {
    return { ok: false, error: "network" };
  }
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (method === "POST") headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await ports.fetcher(`${ports.baseUrl}${path}`, {
      method,
      headers,
      credentials: "omit",
      signal: AbortSignal.timeout(requestTimeoutMs),
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (!response.ok)
    return {
      ok: false,
      error: [401, 403].includes(response.status) ? "access" : "server",
      status: response.status,
    };
  try {
    const parsed = schema.safeParse(await response.json());
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, error: "invalid" };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

async function request<T>(
  ports: ApiPorts,
  path: string,
  method: Method,
  body: unknown,
  schema: z.ZodType<T>,
): Promise<ApiResult<T>> {
  const first = await fetchOnce(ports, path, method, body, schema);
  if (first.ok || method !== "GET") return first;
  if (first.error !== "network" && first.status !== 502 && first.status !== 503)
    return first;
  await ports.delay(retryDelayMs);
  return fetchOnce(ports, path, method, body, schema);
}

export function createApi(ports: ApiPorts) {
  return {
    pageClaims: (url: string) =>
      request(
        ports,
        `/api/page-claims?url=${encodeURIComponent(url)}`,
        "GET",
        null,
        pageClaimsSchema,
      ),
    me: () => request(ports, "/api/me", "GET", null, meSchema),
    repo: (repo: string) =>
      request(
        ports,
        `/api/repos/${repo.split("/").map(encodeURIComponent).join("/")}`,
        "GET",
        null,
        repoSchema,
      ),
    scan: (repo: string) =>
      request(ports, "/api/scan", "POST", { repo }, actionSchema),
    source: (repo: string, kind: string, url: string) =>
      request(ports, "/api/sources", "POST", { repo, kind, url }, actionSchema),
    signout: () => request(ports, "/auth/signout", "POST", {}, actionSchema),
  };
}

export async function chromeToken(): Promise<string | null> {
  const value = await chrome.storage.local.get("sessionToken");
  return typeof value.sessionToken === "string" ? value.sessionToken : null;
}

export const api = createApi({
  baseUrl: publicUrl,
  fetcher: fetch,
  readToken: chromeToken,
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
});
