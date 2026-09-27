import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import type { AccountRepoData } from "../data.ts";
import { repoPath } from "../presentation.ts";

export function UnscannedInspector({ repo }: { repo: AccountRepoData }) {
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canScan = repo.visibility === "public" && !repo.archived && !repo.fork;
  const request = async () => {
    setRequesting(true);
    const result = await api.scan(repo.repo);
    setFeedback(result.ok ? copy.repoScanQueued : copy.repoScanFailed);
    setRequesting(false);
  };
  return (
    <aside
      className="sky-inspector panel"
      id="selected-repo-panel"
      aria-live="polite"
    >
      <p className="eyebrow">{copy.skyHoldingTitle}</p>
      <h2>{repo.repo}</h2>
      {repo.checked ? (
        <StatusBadge label={repo.label ?? copy.statusNoTelemetry} />
      ) : (
        <span className="simulation-tag">{copy.skyUnscannedTag}</span>
      )}
      <p className="quiet-copy sky-holding-note">
        {repo.checked
          ? copy.skyHoldingChecked
          : repo.visibility === "private"
            ? copy.skyHoldingPrivate
            : copy.skyHoldingPublic}
      </p>
      {repo.checked && (
        <a className="button" href={repoPath(repo.repo)}>
          {copy.accountReposOpenResult}
        </a>
      )}
      {canScan ? (
        <button
          type="button"
          disabled={requesting}
          onClick={() => void request()}
        >
          {requesting ? copy.skyScanPending : copy.skyScanAction}
        </button>
      ) : !repo.checked ? (
        <a className="button" href="/signin">
          {copy.skyHoldingConnect}
        </a>
      ) : null}
      {feedback && <p role="status">{feedback}</p>}
    </aside>
  );
}
