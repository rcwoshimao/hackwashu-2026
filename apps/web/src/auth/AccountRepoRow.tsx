import { copy } from "@ground-control/copy";
import type { Connection } from "../api.ts";
import type { AccountRepoData } from "../data.ts";
import { ConnectResult } from "./ConnectResult.tsx";

export type ScanState = "pending" | "queued" | "cached" | "failed";

export function canScan(repo: AccountRepoData): boolean {
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

export function RepoRow({
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
          {repo.checked && !repo.scanned && (
            <span>{copy.accountReposChecked}</span>
          )}
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
