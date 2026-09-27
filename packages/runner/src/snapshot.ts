import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";
import type { RepositorySnapshot, Result, SnapshotError } from "./types.ts";

const gitTimeoutMs = 5_000;
const gitOutputLimitBytes = 10_000_000;

function inside(root: string, target: string): boolean {
  return target === root || target.startsWith(`${root}${sep}`);
}

function safeTarget(root: string, path: string): Result<string, SnapshotError> {
  if (isAbsolute(path) || /^[A-Za-z]:/.test(path) || path.includes("\0")) {
    return { ok: false, error: { code: "unsafe_path", path } };
  }
  const target = resolve(root, path);
  if (!inside(root, target))
    return { ok: false, error: { code: "unsafe_path", path } };
  if (!existsSync(target)) return { ok: true, value: target };
  try {
    const resolved = realpathSync(target);
    if (!inside(root, resolved))
      return { ok: false, error: { code: "unsafe_path", path } };
    return { ok: true, value: target };
  } catch {
    return { ok: false, error: { code: "io_error", path } };
  }
}

export function memorySnapshot(
  files: Readonly<Record<string, string>>,
  tracked: readonly string[] = Object.keys(files),
): RepositorySnapshot {
  const contents = new Map(Object.entries(files));
  const paths = [...tracked];
  return {
    pathExists: (path) => ({ ok: true, value: contents.has(path) }),
    readText: (path) => ({ ok: true, value: contents.get(path) ?? null }),
    trackedPaths: () => ({ ok: true, value: paths }),
  };
}

function diskSnapshot(
  root: string,
  paths: readonly string[],
): RepositorySnapshot {
  return {
    pathExists: (path) => {
      const target = safeTarget(root, path);
      return target.ok ? { ok: true, value: existsSync(target.value) } : target;
    },
    readText: (path) => {
      const target = safeTarget(root, path);
      if (!target.ok) return target;
      if (!existsSync(target.value)) return { ok: true, value: null };
      try {
        return { ok: true, value: readFileSync(target.value, "utf8") };
      } catch {
        return { ok: false, error: { code: "io_error", path } };
      }
    },
    trackedPaths: () => ({ ok: true, value: paths }),
  };
}

export function fileSystemSnapshot(
  rootPath: string,
  trackedPaths: readonly string[],
): Result<RepositorySnapshot, SnapshotError> {
  try {
    return {
      ok: true,
      value: diskSnapshot(realpathSync(rootPath), [...trackedPaths]),
    };
  } catch {
    return { ok: false, error: { code: "io_error", path: rootPath } };
  }
}

export function gitSnapshot(
  rootPath: string,
): Result<RepositorySnapshot, SnapshotError> {
  let root: string;
  try {
    root = realpathSync(rootPath);
  } catch {
    return { ok: false, error: { code: "io_error", path: rootPath } };
  }
  const listed = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    timeout: gitTimeoutMs,
    maxBuffer: gitOutputLimitBytes,
  });
  if (
    listed.error ||
    listed.status !== 0 ||
    typeof listed.stdout !== "string"
  ) {
    return { ok: false, error: { code: "git_error", path: rootPath } };
  }
  const paths = listed.stdout.split("\0").filter((path) => path.length > 0);
  return fileSystemSnapshot(root, paths);
}
