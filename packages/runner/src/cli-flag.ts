import { performance } from "node:perf_hooks";
import { runCommand } from "./command.ts";
import { readManifest } from "./manifest.ts";
import type { RuntimeOutcome } from "./runtime-types.ts";
import type { RepositorySnapshot } from "./types.ts";

function quotedFlag(source: string, flag: string): boolean {
  const escaped = flag.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`["'\x60]${escaped}["'\x60]`, "u").test(source);
}

function binPath(
  manifest: Readonly<Record<string, unknown>> | null,
): string | null {
  if (!manifest) return null;
  if (typeof manifest.bin === "string") return manifest.bin;
  if (
    typeof manifest.bin !== "object" ||
    manifest.bin === null ||
    Array.isArray(manifest.bin)
  )
    return null;
  const first = Object.values(manifest.bin)[0];
  return typeof first === "string" ? first : null;
}

export async function runCliFlag(
  flag: string,
  snapshot: RepositorySnapshot,
  cwd: string,
): Promise<RuntimeOutcome> {
  const startedAt = performance.now();
  const listed = snapshot.trackedPaths();
  if (!listed.ok)
    return {
      status: "unverified",
      expected: `${flag} literal in source`,
      actual: listed.error.code,
      durationMs: 0,
    };
  let found = false;
  for (const path of listed.value) {
    if (
      !/\.(?:js|jsx|ts|tsx|py)$/u.test(path) ||
      /(^|\/)(?:node_modules|dist|build)(\/|$)/u.test(path)
    )
      continue;
    const read = snapshot.readText(path);
    if (read.ok && read.value !== null && quotedFlag(read.value, flag))
      found = true;
  }
  if (!found)
    return {
      status: "fail",
      expected: `${flag} literal in source`,
      actual: "Flag not found",
      durationMs: performance.now() - startedAt,
    };
  const manifest = readManifest(snapshot);
  if (!manifest.ok)
    return {
      status: "unverified",
      expected: `${flag} literal in source`,
      actual: manifest.error.code,
      durationMs: performance.now() - startedAt,
    };
  const executable = binPath(manifest.value);
  if (!executable)
    return {
      status: "pass",
      expected: `${flag} literal in source`,
      actual: "Flag found",
      durationMs: performance.now() - startedAt,
    };
  if (!/^[A-Za-z0-9_./-]+$/u.test(executable) || executable.includes(".."))
    return {
      status: "unverified",
      expected: "Safe bin path",
      actual: "Invalid package bin path",
      durationMs: performance.now() - startedAt,
    };
  const help = await runCommand(`node ${executable} --help`, cwd);
  const pass =
    (help.status === "pass" || help.status === "flaky") &&
    help.actual.includes(flag);
  return {
    status: pass ? help.status : "fail",
    expected: `${flag} in --help`,
    actual: help.actual,
    durationMs: performance.now() - startedAt,
  };
}
