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
export type SkyScope = "all" | "mine" | "public" | "private";
export type SkyScanFilter = "all" | "scanned" | "unscanned";

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
  status: SkyScanFilter,
  search: string,
): SkyEntry[] {
  const term = search.trim().toLowerCase();
  return entries.filter((entry) => {
    const own = entry.account !== null;
    const visibility = entry.account?.visibility ?? "public";
    return (
      entry.repo.toLowerCase().includes(term) &&
      (scope === "all" || (scope === "mine" && own) || scope === visibility) &&
      (status === "all" ||
        (status === "scanned"
          ? entry.kind !== "unscanned"
          : entry.kind === "unscanned"))
    );
  });
}
