import {
  githubRateLimitMaxWaitMs,
  githubRequestAttempts,
  githubRetryBaseMs,
  githubSecondaryLimitWaitMs,
} from "../../../config/limits.ts";

export type Sleep = (ms: number) => Promise<void>;

export const sleep: Sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function githubStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error))
    return null;
  return typeof error.status === "number" ? error.status : null;
}

function header(error: unknown, name: string): string {
  if (typeof error !== "object" || error === null || !("response" in error))
    return "";
  const response = error.response;
  if (typeof response !== "object" || response === null) return "";
  if (!("headers" in response)) return "";
  const headers = response.headers;
  if (typeof headers !== "object" || headers === null || !(name in headers))
    return "";
  return String(Reflect.get(headers, name) ?? "");
}

/**
 * How long GitHub asks us to wait, or null when the error is not a rate limit.
 * A 403 is only a rate limit when GitHub says so; otherwise it is a real denial.
 */
export function rateLimitDelayMs(error: unknown, nowMs: number): number | null {
  const status = githubStatus(error);
  if (status !== 403 && status !== 429) return null;
  const retryAfterSeconds = Number(header(error, "retry-after"));
  if (retryAfterSeconds > 0) return retryAfterSeconds * 1000;
  const resetSeconds = Number(header(error, "x-ratelimit-reset"));
  if (header(error, "x-ratelimit-remaining") === "0" && resetSeconds > 0)
    return Math.max(0, resetSeconds * 1000 - nowMs) + 1000;
  const message = error instanceof Error ? error.message : "";
  if (status === 429 || /rate limit/i.test(message))
    return githubSecondaryLimitWaitMs;
  return null;
}

export async function retry<T>(
  operation: () => Promise<T>,
  wait: Sleep = sleep,
): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < githubRequestAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      last = error;
      const finalAttempt = attempt === githubRequestAttempts - 1;
      const limitMs = rateLimitDelayMs(error, Date.now());
      if (limitMs !== null) {
        if (finalAttempt || limitMs > githubRateLimitMaxWaitMs) throw error;
        await wait(limitMs);
        continue;
      }
      const status = githubStatus(error);
      if (status !== null && status < 500) throw error;
      if (!finalAttempt) await wait(githubRetryBaseMs * 2 ** attempt);
    }
  }
  throw last;
}
