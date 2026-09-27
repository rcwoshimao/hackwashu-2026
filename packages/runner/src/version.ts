import { intersects, validRange } from "semver";
import { nodeEngine, readManifest } from "./manifest.ts";
import { fail, ok, snapshotFail } from "./result.ts";
import type {
  RepositorySnapshot,
  Result,
  RunnerError,
  StaticCheckResult,
} from "./types.ts";

type Constraint = { path: string; range: string };

function versionFile(
  snapshot: RepositorySnapshot,
  path: ".nvmrc" | ".node-version",
): Result<Constraint | null, RunnerError> {
  const read = snapshot.readText(path);
  if (!read.ok) return snapshotFail(read.error);
  const range = read.value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return ok(range ? { path, range } : null);
}

function projectConstraints(
  snapshot: RepositorySnapshot,
): Result<readonly Constraint[], RunnerError> {
  const manifest = readManifest(snapshot);
  if (!manifest.ok) return manifest;
  const constraints: Constraint[] = [];
  const engine = nodeEngine(manifest.value);
  if (engine)
    constraints.push({ path: "package.json#engines.node", range: engine });
  for (const path of [".nvmrc", ".node-version"] as const) {
    const found = versionFile(snapshot, path);
    if (!found.ok) return found;
    if (found.value) constraints.push(found.value);
  }
  return ok(constraints);
}

export function checkVersion(
  snapshot: RepositorySnapshot,
  range: string,
): Result<Extract<StaticCheckResult, { kind: "version" }>, RunnerError> {
  if (range.trim().length === 0 || validRange(range) === null)
    return fail("invalid_range", range);
  const listed = projectConstraints(snapshot);
  if (!listed.ok) return listed;
  if (listed.value.length === 0) {
    return ok({
      kind: "version",
      status: "unverified",
      range,
      constraints: [],
    });
  }
  for (const constraint of listed.value) {
    if (validRange(constraint.range) === null)
      return fail("invalid_range", constraint.path);
  }
  const combined = listed.value.map((item) => item.range).join(" ");
  const status = intersects(range, combined) ? "pass" : "fail";
  return ok({ kind: "version", status, range, constraints: listed.value });
}
