import type { AccountRepoData } from "../data.ts";

export function filterAccountRepos(
  repos: readonly AccountRepoData[],
  query: string,
  filter: string,
): AccountRepoData[] {
  const term = query.trim().toLowerCase();
  return repos.filter((repo) => {
    const matches = `${repo.repo} ${repo.description ?? ""}`
      .toLowerCase()
      .includes(term);
    if (!matches) return false;
    if (filter === "deep_checks") return repo.deepChecksSetup === true;
    if (filter === "unscanned") return !repo.scanned && !repo.checked;
    return filter === "all" || repo.visibility === filter;
  });
}
