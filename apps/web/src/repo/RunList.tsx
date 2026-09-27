import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import type { RepoData } from "../data.ts";
import { readableDate } from "../presentation.ts";

export function RunList({
  data,
  canClear,
  onClear,
}: {
  data: RepoData;
  canClear: boolean;
  onClear: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const clear = async () => {
    if (!window.confirm(copy.repoClearRunsConfirm)) return;
    setPending(true);
    setFailed(false);
    const result = await api.clearRunHistory(data.repo);
    setPending(false);
    if (result.ok) onClear();
    else setFailed(true);
  };
  return (
    <section className="panel repo-runs">
      <div className="panel-heading">
        <h2>{copy.repoRuns}</h2>
        {canClear && data.runs.length > 0 && (
          <button
            type="button"
            className="button-secondary"
            disabled={pending}
            onClick={() => void clear()}
          >
            {copy.repoClearRuns}
          </button>
        )}
      </div>
      {failed && <p role="alert">{copy.repoClearRunsFailed}</p>}
      {data.runs.length === 0 ? (
        <p>
          {data.recentRunsClearedAt ? copy.repoRunsCleared : copy.repoNoRuns}
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{copy.repoCommit}</th>
                <th>{copy.repoCheckedAt}</th>
                <th>{copy.repoRunStatus}</th>
                <th>{copy.repoRunTier}</th>
                <th>{copy.repoRunFailures}</th>
                <th>{copy.repoViewRun}</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => (
                <tr key={run.id}>
                  <td className="mono">{run.commitSha.slice(0, 10)}</td>
                  <td>{readableDate(run.createdAt)}</td>
                  <td>
                    {run.verdict === "failure"
                      ? copy.commonFailure
                      : run.verdict === "success"
                        ? copy.repoRunNoConfirmedFailures
                        : copy.commonPending}
                  </td>
                  <td>
                    {run.origin === "ci"
                      ? copy.repoRunDeep
                      : run.origin === "public_scan"
                        ? copy.repoRunPublic
                        : copy.repoRunUnknown}
                  </td>
                  <td className="mono">{run.failingCount.toLocaleString()}</td>
                  <td>
                    <a href={`/runs/${encodeURIComponent(run.id)}`}>
                      {copy.repoViewRun}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
