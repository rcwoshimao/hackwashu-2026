import { createHash } from "node:crypto";
import type { Context } from "hono";
import { z } from "zod";
import type { ApiDeps } from "./types.ts";

export const repoSchema = z.object({
  repo: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
});

export async function requestBody(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function fail(
  c: Context,
  code: string,
  status: 400 | 401 | 403 | 404 | 409 | 429 | 502 | 503,
) {
  return c.json({ error: code }, status);
}

export function emit(deps: ApiDeps, kind: string, payload: unknown): void {
  const event = deps.store.appendEvent(kind, deps.now().toISOString(), payload);
  deps.events.publish(event);
}

export function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}
