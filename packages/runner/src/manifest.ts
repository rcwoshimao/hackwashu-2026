import { fail, ok, snapshotFail } from "./result.ts";
import type { RepositorySnapshot, Result, RunnerError } from "./types.ts";

type JsonObject = Readonly<Record<string, unknown>>;

function object(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readManifest(
  snapshot: RepositorySnapshot,
): Result<JsonObject | null, RunnerError> {
  const read = snapshot.readText("package.json");
  if (!read.ok) return snapshotFail(read.error);
  if (read.value === null) return ok(null);
  try {
    const parsed: unknown = JSON.parse(read.value);
    return object(parsed)
      ? ok(parsed)
      : fail("invalid_manifest", "package.json");
  } catch {
    return fail("invalid_manifest", "package.json");
  }
}

export function scriptInManifest(
  manifest: JsonObject | null,
  script: string,
): boolean {
  if (manifest === null || !object(manifest.scripts)) return false;
  return typeof manifest.scripts[script] === "string";
}

export function nodeEngine(manifest: JsonObject | null): string | null {
  if (manifest === null || !object(manifest.engines)) return null;
  return typeof manifest.engines.node === "string"
    ? manifest.engines.node
    : null;
}
