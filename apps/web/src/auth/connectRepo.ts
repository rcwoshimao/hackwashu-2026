import type { AccountRepoData } from "../data.ts";
import { repoFromInput } from "../presentation.ts";

export function connectableRepos(repos: AccountRepoData[]): AccountRepoData[] {
  return repos
    .filter((repo) => repo.canAdmin)
    .sort((left, right) => left.repo.localeCompare(right.repo));
}

/** Any GitHub link people paste resolves, including subfolders and files. */
export function normalizeGitHubRepo(value: string): string | null {
  return repoFromInput(value);
}
