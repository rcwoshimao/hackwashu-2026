import type { RepoData } from "../data.ts";

export function scanRunId(
  runs: RepoData["runs"],
  commitSha: string,
): string | null {
  const sameCommit = runs.filter((run) => run.commitSha === commitSha);
  return (
    sameCommit.find((run) => run.origin === "public_scan")?.id ??
    sameCommit.find((run) => run.origin === "unknown")?.id ??
    null
  );
}
