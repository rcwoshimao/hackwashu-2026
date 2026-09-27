import { expect, test } from "bun:test";
import { rateLimitDelayMs, retry } from "../src/github-retry.ts";

class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly response: { headers: Record<string, string> } = { headers: {} },
  ) {
    super(message);
  }
}

const nowMs = Date.parse("2026-09-26T00:00:00Z");

test("retry-after is honored", () => {
  const error = new GitHubError(403, "secondary rate limit", {
    headers: { "retry-after": "30" },
  });
  expect(rateLimitDelayMs(error, nowMs)).toBe(30_000);
});

test("an exhausted quota waits until its reset", () => {
  const error = new GitHubError(403, "API rate limit exceeded", {
    headers: {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(nowMs / 1000 + 20),
    },
  });
  expect(rateLimitDelayMs(error, nowMs)).toBe(21_000);
});

test("a secondary limit without headers waits a minute", () => {
  const error = new GitHubError(
    403,
    "You have exceeded a secondary rate limit",
  );
  expect(rateLimitDelayMs(error, nowMs)).toBe(60_000);
});

test("other 403s and 404s are not rate limits", () => {
  expect(rateLimitDelayMs(new GitHubError(403, "Forbidden"), nowMs)).toBeNull();
  expect(rateLimitDelayMs(new GitHubError(404, "Not Found"), nowMs)).toBeNull();
});

test("retry waits out a rate limit and then succeeds", async () => {
  const waits: number[] = [];
  let calls = 0;
  const value = await retry(
    async () => {
      calls += 1;
      if (calls === 1)
        throw new GitHubError(403, "secondary rate limit", {
          headers: { "retry-after": "5" },
        });
      return "ok";
    },
    async (ms) => {
      waits.push(ms);
    },
  );
  expect(value).toBe("ok");
  expect(waits).toEqual([5_000]);
});

test("retry gives up at once on a denial or an overlong wait", async () => {
  const noWait = async () => {};
  await expect(
    retry(() => Promise.reject(new GitHubError(404, "Not Found")), noWait),
  ).rejects.toThrow("Not Found");
  const hourLong = new GitHubError(403, "rate limit", {
    headers: { "retry-after": "3600" },
  });
  await expect(retry(() => Promise.reject(hourLong), noWait)).rejects.toBe(
    hourLong,
  );
});
