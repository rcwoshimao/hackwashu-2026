import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useState } from "react";
import { api, type Connection } from "../api.ts";
import { accountRepoRowsPerPage } from "../config.ts";
import type { AccountRepoData } from "../data.ts";
import { accountEventNames, watchEvents } from "../realtime.ts";
import { RepoRow, type ScanState } from "./AccountRepoRow.tsx";
import { filterAccountRepos } from "./accountRepoFilter.ts";
import { personalScanRepos } from "./personalScans.ts";

export function AccountRepos({ login }: { login: string }) {
  const [repos, setRepos] = useState<AccountRepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busyRepo, setBusyRepo] = useState<string | null>(null);
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
    failed: number;
  } | null>(null);
  const [scanStates, setScanStates] = useState<Record<string, ScanState>>({});
  const [connections, setConnections] = useState<Record<string, Connection>>(
    {},
  );
  const [connectErrors, setConnectErrors] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      const result = await api.accountRepos(controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) {
        setRepos(result.value.repos);
        setTruncated(result.value.truncated);
      } else setFailed(true);
      setLoading(false);
    };
    void refresh();
    const events = new EventSource("/api/events");
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 500);
    };
    const stop = watchEvents(events, accountEventNames, schedule);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      stop();
      events.close();
    };
  }, []);

  const shown = useMemo(() => {
    return filterAccountRepos(repos, query, filter);
  }, [repos, query, filter]);
  const pageCount = Math.max(
    1,
    Math.ceil(shown.length / accountRepoRowsPerPage),
  );
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * accountRepoRowsPerPage;
  const visible = shown.slice(pageStart, pageStart + accountRepoRowsPerPage);
  const scannable = personalScanRepos(repos, login);
  const deepChecksCount = repos.filter((repo) => repo.deepChecksSetup).length;
  const bulkActive =
    bulkProgress !== null && bulkProgress.done < bulkProgress.total;

  const scanOne = async (repo: string) => {
    setBusyRepo(repo);
    setScanStates((current) => ({ ...current, [repo]: "pending" }));
    const result = await api.scan(repo);
    setScanStates((current) => ({
      ...current,
      [repo]: result.ok ? result.value.state : "failed",
    }));
    if (result.ok && result.value.state === "cached")
      setRepos((current) =>
        current.map((item) =>
          item.repo === repo ? { ...item, scanned: true } : item,
        ),
      );
    setBusyRepo(null);
    return result.ok;
  };

  const scanAll = async () => {
    const names = scannable.map((repo) => repo.repo);
    setBulkProgress({ done: 0, total: names.length, failed: 0 });
    let failures = 0;
    for (const [index, name] of names.entries()) {
      if (!(await scanOne(name))) failures += 1;
      setBulkProgress({
        done: index + 1,
        total: names.length,
        failed: failures,
      });
    }
  };

  const connectOne = async (repo: string, runtime = false) => {
    setBusyRepo(repo);
    setConnectingRepo(repo);
    const result = await api.connect(repo, runtime);
    if (result.ok) {
      setConnections((current) => ({ ...current, [repo]: result.value }));
      setRepos((current) =>
        current.map((item) =>
          item.repo === repo
            ? {
                ...item,
                connected: true,
                runtimeEnabled:
                  item.runtimeEnabled ||
                  runtime ||
                  item.visibility === "private",
              }
            : item,
        ),
      );
    } else setConnectErrors((current) => ({ ...current, [repo]: true }));
    setConnectingRepo(null);
    setBusyRepo(null);
  };

  return (
    <section className="account-repos" aria-labelledby="account-repos-title">
      <div className="panel-heading">
        <div>
          <h2 id="account-repos-title">{copy.accountReposTitle}</h2>
          <p>{copy.accountReposIntro}</p>
        </div>
        <a href="/connect">{copy.accountReposManual}</a>
      </div>
      {loading ? (
        <p role="status">{copy.accountReposLoading}</p>
      ) : failed ? (
        <p role="alert">{copy.accountReposFailed}</p>
      ) : repos.length === 0 ? (
        <p>{copy.accountReposEmpty}</p>
      ) : (
        <>
          <p className="form-hint">
            {copy.accountReposPublicHint} {copy.accountReposPrivateHint}
          </p>
          <p className="form-hint">
            {deepChecksCount}{" "}
            {deepChecksCount === 1
              ? copy.accountReposDeepSummaryOne
              : copy.accountReposDeepSummaryMany}
          </p>
          {truncated && <p role="status">{copy.accountReposTruncated}</p>}
          <div className="account-repo-toolbar">
            <div>
              <label htmlFor="account-repo-search">
                {copy.accountReposSearch}
              </label>
              <input
                id="account-repo-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={copy.accountReposSearchPlaceholder}
              />
            </div>
            <div>
              <label htmlFor="account-repo-filter">
                {copy.accountReposFilter}
              </label>
              <select
                id="account-repo-filter"
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{copy.accountReposFilterAll}</option>
                <option value="public">{copy.accountReposPublic}</option>
                <option value="private">{copy.accountReposPrivate}</option>
                <option value="deep_checks">
                  {copy.accountReposFilterDeepChecks}
                </option>
                <option value="unscanned">
                  {copy.accountReposFilterUnscanned}
                </option>
              </select>
            </div>
            <button
              type="button"
              disabled={
                bulkActive || busyRepo !== null || scannable.length === 0
              }
              onClick={() => void scanAll()}
            >
              {copy.accountReposScanAll} ({scannable.length})
            </button>
          </div>
          <p className="form-hint">{copy.accountReposScanAllHint}</p>
          {bulkProgress && (
            <p role="status" className="form-feedback">
              {bulkProgress.done === bulkProgress.total
                ? copy.accountReposScanAllDone
                : copy.accountReposScanAllProgress}
              : {bulkProgress.done}/{bulkProgress.total}
              {bulkProgress.failed > 0 &&
                ` · ${copy.accountReposScanAllFailed}: ${bulkProgress.failed}`}
            </p>
          )}
          {shown.length === 0 ? (
            <p>{copy.accountReposNoMatches}</p>
          ) : (
            <ul className="account-repo-list">
              {visible.map((repo) => (
                <RepoRow
                  key={repo.repo}
                  repo={repo}
                  busy={busyRepo !== null || bulkActive}
                  connecting={connectingRepo === repo.repo}
                  scanState={scanStates[repo.repo]}
                  connection={connections[repo.repo]}
                  connectError={connectErrors[repo.repo] === true}
                  onScan={() => void scanOne(repo.repo)}
                  onConnect={() => void connectOne(repo.repo)}
                  onEnableRuntime={() => void connectOne(repo.repo, true)}
                  login={login}
                />
              ))}
            </ul>
          )}
          {shown.length > accountRepoRowsPerPage && (
            <nav
              className="account-repo-pages"
              aria-label={copy.accountReposTitle}
            >
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                {copy.accountReposPagePrevious}
              </button>
              <span className="mono">
                {currentPage} {copy.accountReposPageOf} {pageCount}
              </span>
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                {copy.accountReposPageNext}
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
