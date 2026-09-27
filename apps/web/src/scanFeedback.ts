import { copy } from "@ground-control/copy";
import { z } from "zod";
import type { ApiError } from "./api.ts";

const failedScanSchema = z.object({ requestId: z.string() });

export function scanErrorMessage(error: ApiError, fallback: string): string {
  if (error.reason === "no_markdown_readme") return copy.scanNoReadme;
  if (error.status === 429) return copy.skyScanLimit;
  if (error.reason === "github_unavailable") return copy.scanGithubUnavailable;
  return fallback;
}

export function scanFailedFor(data: string, requestId: string): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(data) as unknown;
  } catch {
    return false;
  }
  const parsed = failedScanSchema.safeParse(payload);
  return parsed.success && parsed.data.requestId === requestId;
}
