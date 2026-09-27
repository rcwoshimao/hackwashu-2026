import type { AccountRepoData, Satellite } from "../data.ts";

export type SkyEntry =
  | {
      kind: "scanned";
      repo: string;
      satellite: Satellite;
      account: AccountRepoData | null;
    }
  | { kind: "unscanned"; repo: string; account: AccountRepoData }
  | { kind: "checked"; repo: string; account: AccountRepoData };
export type SkyScope = "mine" | "public";

export function catalogEntries(
  satellites: Satellite[],
  accountRepos: AccountRepoData[],
): SkyEntry[] {
  const accounts = new Map(
    accountRepos.map((repo) => [repo.repo.toLowerCase(), repo]),
  );
  const scanned: SkyEntry[] = satellites
    .filter((satellite) => !satellite.simulated)
    .map((satellite) => ({
      kind: "scanned",
      repo: satellite.repo,
      satellite,
      account: accounts.get(satellite.repo.toLowerCase()) ?? null,
    }));
  const known = new Set(scanned.map((entry) => entry.repo.toLowerCase()));
  const unscanned: SkyEntry[] = accountRepos
    .filter((repo) => !known.has(repo.repo.toLowerCase()))
    .map((repo) => ({
      kind: repo.checked ? "checked" : "unscanned",
      repo: repo.repo,
      account: repo,
    }));
  return [...scanned, ...unscanned];
}

export function filterEntries(
  entries: SkyEntry[],
  scope: SkyScope,
  search: string,
  login: string | null = null,
): SkyEntry[] {
  const term = search.trim().toLowerCase();
  return entries.filter((entry) => {
    const own =
      entry.account !== null ||
      (login !== null &&
        entry.repo.split("/")[0]?.toLowerCase() === login.toLowerCase());
    return (
      entry.repo.toLowerCase().includes(term) &&
      (scope === "mine" ? own : !own && entry.kind === "scanned")
    );
  });
}
