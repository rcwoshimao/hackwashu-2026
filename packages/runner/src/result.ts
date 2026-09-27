import type { Result, RunnerError, SnapshotError } from "./types.ts";

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail(
  code: RunnerError["code"],
  subject?: string,
): Result<never, RunnerError> {
  return {
    ok: false,
    error: subject === undefined ? { code } : { code, subject },
  };
}

export function snapshotFail(error: SnapshotError): Result<never, RunnerError> {
  return { ok: false, error: { code: "snapshot_error", snapshot: error } };
}
