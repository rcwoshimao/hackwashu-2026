import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useState } from "react";
import { api, type Connection } from "../api.ts";
import type { AccountRepoData } from "../data.ts";
import { ConnectResult } from "./ConnectResult.tsx";

type ScanState = "pending" | "queued" | "cached" | "failed";

function canScan(repo: AccountRepoData): boolean {
  return repo.visibility === "public" && !repo.archived && !repo.fork;
}

function RepoActions({
  repo,
  busy,
  connecting,
  scanState,
  onScan,
  onConnect,
}: {
  repo: AccountRepoData;
  busy: boolean;
  connecting: boolean;
  scanState: ScanState | undefined;
  onScan: () => void;
  onConnect: () => void;
}) {
  return (
    <div className="account-repo-actions">
      {canScan(repo) && (
        <button type="button" disabled={busy} onClick={onScan}>
          {scanState === "pending"
            ? copy.accountReposScanning
            : copy.accountReposScan}
        </button>
      )}
      {repo.canAdmin && !repo.connected && (
        <button
          type="button"
          className="button-secondary"
          disabled={busy}
          onClick={onConnect}
        >
          {connecting ? copy.accountReposConnecting : copy.accountReposConnect}
        </button>
      )}
      {(repo.scanned || repo.connected) && (
        <a
          href={`/repos/${repo.repo.split("/").map(encodeURIComponent).join("/")}`}
        >
          {copy.accountReposOpenResult}
        </a>
      )}
    </div>
  );
}

function RepoRow({
  repo,
  busy,
  connecting,
  scanState,
  connection,
  connectError,
  onScan,
  onConnect,
}: {
  repo: AccountRepoData;
  busy: boolean;
  connecting: boolean;
  scanState: ScanState | undefined;
  connection: Connection | undefined;
  connectError: boolean;
  onScan: () => void;
  onConnect: () => void;
}) {
  const scanText = {
    pending: copy.accountReposScanning,
    queued: copy.accountReposScanQueued,
    cached: copy.accountReposScanCached,
    failed: copy.accountReposScanFailed,
  };
  return (
    <li className="account-repo-item">
      <div className="account-repo-topline">
        <strong>{repo.repo}</strong>
        <span className="account-repo-tags">
          <span>
            {repo.visibility === "private"
              ? copy.accountReposPrivate
              : copy.accountReposPublic}
          </span>
          {repo.archived && <span>{copy.accountReposArchived}</span>}
          {repo.fork && <span>{copy.accountReposFork}</span>}
          {repo.connected && <span>{copy.accountReposConnected}</span>}
          {repo.scanned && <span>{copy.accountReposScanned}</span>}
        </span>
      </div>
      {repo.description && <p>{repo.description}</p>}
      {repo.language && <small>{repo.language}</small>}
      <RepoActions
        repo={repo}
        busy={busy}
        connecting={connecting}
        scanState={scanState}
        onScan={onScan}
        onConnect={onConnect}
      />
      {!repo.canAdmin && repo.visibility === "private" && (
        <p className="form-hint">{copy.accountReposNotAdmin}</p>
      )}
      {scanState && (
        <p className="form-hint" role="status">
          {scanText[scanState]}
        </p>
      )}
      {connection && (
        <ConnectResult
          connection={connection}
          serverUrl={window.location.origin}
        />
      )}
      {connectError && <p role="alert">{copy.accountReposConnectFailed}</p>}
    </li>
  );
}

export function AccountRepos() {
  const [repos, setRepos] = useState<AccountRepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [query, setQuery] = useState("");
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
    void api.accountRepos(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setRepos(result.value.repos);
        setTruncated(result.value.truncated);
      } else setFailed(true);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return repos.filter((repo) =>
      `${repo.repo} ${repo.description ?? ""}`.toLowerCase().includes(term),
    );
  }, [repos, query]);
  const scannable = repos.filter(canScan);
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

  const connectOne = async (repo: string) => {
    setBusyRepo(repo);
    setConnectingRepo(repo);
    const result = await api.connect(repo);
    if (result.ok) {
      setConnections((current) => ({ ...current, [repo]: result.value }));
      setRepos((current) =>
        current.map((item) =>
          item.repo === repo ? { ...item, connected: true } : item,
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
          {truncated && <p role="status">{copy.accountReposTruncated}</p>}
          <div className="account-repo-toolbar">
            <div>
              <label htmlFor="account-repo-search">
                {copy.accountReposSearch}
              </label>
              <input
                id="account-repo-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.accountReposSearchPlaceholder}
              />
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
              {shown.map((repo) => (
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
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
