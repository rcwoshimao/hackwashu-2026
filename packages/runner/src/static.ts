import { matchingSourcePaths } from "./code-scan.ts";
import { readManifest, scriptInManifest } from "./manifest.ts";
import { fail, ok, snapshotFail } from "./result.ts";
import type {
  RepositorySnapshot,
  Result,
  RunnerError,
  StaticCheck,
  StaticCheckResult,
} from "./types.ts";
import { checkVersion } from "./version.ts";

function validPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes(":") &&
    !path.includes("\0") &&
    path
      .split("/")
      .every((part) => part !== "" && part !== "." && part !== "..")
  );
}

function fileExists(
  snapshot: RepositorySnapshot,
  path: string,
): Result<Extract<StaticCheckResult, { kind: "file_exists" }>, RunnerError> {
  if (!validPath(path)) return fail("invalid_path", path);
  const found = snapshot.pathExists(path);
  if (!found.ok) return snapshotFail(found.error);
  return ok({
    kind: "file_exists",
    status: found.value ? "pass" : "fail",
    path,
  });
}

function scriptExists(
  snapshot: RepositorySnapshot,
  script: string,
): Result<Extract<StaticCheckResult, { kind: "script_exists" }>, RunnerError> {
  if (script.length === 0) return fail("invalid_identifier", script);
  const manifest = readManifest(snapshot);
  if (!manifest.ok) return manifest;
  const exists = scriptInManifest(manifest.value, script);
  return ok({
    kind: "script_exists",
    status: exists ? "pass" : "fail",
    script,
  });
}

function namedSourceCheck(
  snapshot: RepositorySnapshot,
  name: string,
  kind: "code_reference" | "env_var",
): Result<StaticCheckResult, RunnerError> {
  const valid =
    kind === "env_var" ? /^[A-Za-z_][A-Za-z0-9_]*$/ : /^[A-Za-z_$][\w$]*$/;
  if (!valid.test(name)) return fail("invalid_identifier", name);
  const matches = matchingSourcePaths(snapshot, name, kind);
  if (!matches.ok) return matches;
  const status = matches.value.length > 0 ? "pass" : "fail";
  return ok({ kind, status, name, matches: matches.value });
}

export function runStaticCheck(
  check: StaticCheck,
  snapshot: RepositorySnapshot,
): Result<StaticCheckResult, RunnerError> {
  switch (check.kind) {
    case "file_exists":
      return fileExists(snapshot, check.params.path);
    case "script_exists":
      return scriptExists(snapshot, check.params.script);
    case "code_reference":
      return namedSourceCheck(snapshot, check.params.name, check.kind);
    case "env_var":
      return namedSourceCheck(snapshot, check.params.name, check.kind);
    case "version":
      return checkVersion(snapshot, check.params.range);
  }
}
