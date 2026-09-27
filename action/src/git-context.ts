import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gitOutputLimitBytes, gitTimeoutMs } from "./limits.ts";
import type { ChangeMetadata } from "./types.ts";

export type DiffPort = (
  root: string,
  args: readonly string[],
) => string[] | null;

function field(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function stringField(value: unknown, path: readonly string[]): string | null {
  const found = field(value, path);
  return typeof found === "string" && found.length > 0 ? found : null;
}

export function privateRunRepository(
  event: unknown,
  expectedRepo: string | undefined,
): boolean {
  return (
    typeof expectedRepo === "string" &&
    expectedRepo.length > 0 &&
    field(event, ["repository", "private"]) === true &&
    stringField(event, ["repository", "full_name"]) === expectedRepo
  );
}

export function systemGitDiff(
  root: string,
  args: readonly string[],
): string[] | null {
  const result = spawnSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: gitTimeoutMs,
    maxBuffer: gitOutputLimitBytes,
  });
  if (result.error || result.status !== 0 || typeof result.stdout !== "string")
    return null;
  return result.stdout.split(/\r?\n/u).filter((path) => path.length > 0);
}

export function checkedOutCommit(
  root: string,
  diff: DiffPort = systemGitDiff,
): string | null {
  const sha = diff(root, ["rev-parse", "HEAD"])?.[0];
  return sha && /^[0-9a-f]{40,64}$/u.test(sha) ? sha : null;
}

function changedPaths(
  root: string,
  event: unknown,
  diff: DiffPort,
): string[] | null {
  const base = stringField(event, ["pull_request", "base", "sha"]);
  const head = stringField(event, ["pull_request", "head", "sha"]);
  if (base && head) return diff(root, ["diff", "--name-only", base, head]);
  const before = stringField(event, ["before"]);
  const after = stringField(event, ["after"]);
  if (!after) return [];
  if (!before || /^0+$/u.test(before))
    return diff(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      after,
    ]);
  return diff(root, ["diff", "--name-only", before, after]);
}

function watchedDocs(root: string): Set<string> {
  const paths = new Set(["README.md"]);
  try {
    const plan: unknown = JSON.parse(
      readFileSync(join(root, "flightchecks/flightplan.json"), "utf8"),
    );
    const claims = field(plan, ["claims"]);
    if (!Array.isArray(claims)) return paths;
    for (const claim of claims) {
      const occurrences = field(claim, ["occurrences"]);
      if (!Array.isArray(occurrences)) continue;
      for (const occurrence of occurrences) {
        if (stringField(occurrence, ["location", "kind"]) !== "file") continue;
        const path = stringField(occurrence, ["location", "path"]);
        if (path) paths.add(path);
      }
    }
  } catch {
    return paths;
  }
  return paths;
}

export function actionMetadata(
  root: string,
  event: unknown,
  diff: DiffPort = systemGitDiff,
): ChangeMetadata {
  const changedFiles = changedPaths(root, event, diff);
  const authorLogin =
    stringField(event, ["head_commit", "author", "username"]) ??
    stringField(event, ["pull_request", "user", "login"]) ??
    stringField(event, ["pull_request", "head", "user", "login"]) ??
    stringField(event, ["sender", "login"]);
  const metadata: ChangeMetadata = {};
  const pullRequestNumber = field(event, ["number"]);
  const pullRequest = field(event, ["pull_request"]);
  if (
    typeof pullRequest === "object" &&
    pullRequest !== null &&
    typeof pullRequestNumber === "number" &&
    Number.isSafeInteger(pullRequestNumber) &&
    pullRequestNumber > 0
  )
    metadata.pullRequestNumber = pullRequestNumber;
  if (authorLogin) metadata.authorLogin = authorLogin;
  if (changedFiles !== null) {
    const watched = watchedDocs(root);
    metadata.changedFiles = changedFiles;
    metadata.docsChanged = changedFiles.some(
      (path) =>
        watched.has(path) || (path.startsWith("docs/") && path.endsWith(".md")),
    );
    metadata.codeChanged = changedFiles.some(
      (path) =>
        !path.endsWith(".md") &&
        !path.startsWith("docs/") &&
        !path.startsWith("flightchecks/"),
    );
  }
  return metadata;
}

export function metadataForCheckout(
  root: string,
  event: unknown,
  commitSha: string,
  diff: DiffPort = systemGitDiff,
): ChangeMetadata {
  const metadata = actionMetadata(root, event, diff);
  if (
    metadata.pullRequestNumber !== undefined &&
    stringField(event, ["pull_request", "head", "sha"]) !== commitSha
  ) {
    delete metadata.pullRequestNumber;
  }
  return metadata;
}

export function readActionEvent(path: string | undefined): unknown {
  if (!path) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return {};
  }
}
