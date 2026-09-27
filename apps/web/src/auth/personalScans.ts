import type { AccountRepoData } from "../data.ts";
import { canScan } from "./AccountRepoRow.tsx";

export function personalScanRepos(
  repos: readonly AccountRepoData[],
  login: string,
): AccountRepoData[] {
  const owner = login.toLowerCase();
  return repos.filter(
    (repo) => canScan(repo) && repo.repo.split("/")[0]?.toLowerCase() === owner,
  );
}
