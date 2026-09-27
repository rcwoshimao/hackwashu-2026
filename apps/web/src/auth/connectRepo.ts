import type { AccountRepoData } from "../data.ts";
import { validRepo } from "../presentation.ts";

export function connectableRepos(repos: AccountRepoData[]): AccountRepoData[] {
  return repos
    .filter((repo) => repo.canAdmin)
    .sort((left, right) => left.repo.localeCompare(right.repo));
}

export function normalizeGitHubRepo(value: string): string | null {
  const input = value.trim();
  if (validRepo(input)) return input;
  try {
    const url = new URL(input);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) return null;
    const name = segments[1]?.replace(/\.git$/, "");
    const repo = `${segments[0]}/${name}`;
    return validRepo(repo) ? repo : null;
  } catch {
    return null;
  }
}
