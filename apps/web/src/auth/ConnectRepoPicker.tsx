import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api.ts";
import type { AccountRepoData } from "../data.ts";
import { connectableRepos } from "./connectRepo.ts";

export function ConnectRepoPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (repo: AccountRepoData | null) => void;
}) {
  const [repos, setRepos] = useState<AccountRepoData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const result = await api.accountRepos(controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) setRepos(connectableRepos(result.value.repos));
      else setFailed(true);
      setLoading(false);
    };
    void load();
    return () => controller.abort();
  }, []);
  const matches = useMemo(
    () =>
      repos.filter((repo) =>
        `${repo.repo} ${repo.description ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [repos, query],
  );
  const selected = repos.find((repo) => repo.repo === value);
  return (
    <div className="connect-repo-picker">
      <label htmlFor="connect-repo-search">{copy.connectMineSearch}</label>
      <input
        id="connect-repo-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.accountReposSearchPlaceholder}
      />
      {loading && <p role="status">{copy.accountReposLoading}</p>}
      {failed && <p role="alert">{copy.accountReposFailed}</p>}
      {!loading && !failed && repos.length === 0 && (
        <p>{copy.connectMineEmpty}</p>
      )}
      {!loading && !failed && repos.length > 0 && (
        <>
          <label htmlFor="connect-repo-select">{copy.connectMineSelect}</label>
          <select
            id="connect-repo-select"
            value={value}
            onChange={(event) =>
              onSelect(
                repos.find((repo) => repo.repo === event.target.value) ?? null,
              )
            }
          >
            <option value="">{copy.connectMinePlaceholder}</option>
            {value && !selected && <option value={value}>{value}</option>}
            {selected && !matches.includes(selected) && (
              <option value={selected.repo}>{selected.repo}</option>
            )}
            {matches.map((repo) => (
              <option key={repo.repo} value={repo.repo}>
                {repo.repo} ·{" "}
                {repo.visibility === "private"
                  ? copy.accountReposPrivate
                  : copy.accountReposPublic}
              </option>
            ))}
          </select>
          {matches.length === 0 && <p>{copy.accountReposNoMatches}</p>}
        </>
      )}
    </div>
  );
}
