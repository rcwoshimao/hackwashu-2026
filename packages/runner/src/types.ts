import type { Check } from "@ground-control/plan";

export type StaticKind =
  | "file_exists"
  | "script_exists"
  | "code_reference"
  | "env_var"
  | "version";

export type StaticCheck = Extract<Check, { kind: StaticKind }>;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type SnapshotError = {
  code: "git_error" | "io_error" | "unsafe_path";
  path?: string;
};

export interface RepositorySnapshot {
  pathExists(path: string): Result<boolean, SnapshotError>;
  readText(path: string): Result<string | null, SnapshotError>;
  trackedPaths(): Result<readonly string[], SnapshotError>;
}

type PassFail = "pass" | "fail";

export type StaticCheckResult =
  | { kind: "file_exists"; status: PassFail; path: string }
  | { kind: "script_exists"; status: PassFail; script: string }
  | {
      kind: "code_reference";
      status: PassFail;
      name: string;
      matches: readonly string[];
    }
  | {
      kind: "env_var";
      status: PassFail;
      name: string;
      matches: readonly string[];
    }
  | {
      kind: "version";
      status: PassFail | "unverified";
      range: string;
      constraints: readonly { path: string; range: string }[];
    };

export type RunnerError = {
  code:
    | "invalid_path"
    | "invalid_identifier"
    | "invalid_range"
    | "invalid_manifest"
    | "snapshot_error";
  subject?: string;
  snapshot?: SnapshotError;
};
