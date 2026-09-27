import { copy } from "@ground-control/copy";
import { useEffect, useState } from "react";
import { api } from "../api.ts";
import type { SourceData, SourceSync as Sync } from "../data.ts";
import { readableDate } from "../presentation.ts";

type Operation = "idle" | "checking" | "refreshing";

function SyncDetails({ sync }: { sync: Sync | null }) {
  if (!sync) return <p className="quiet-copy">{copy.sourceSyncUnknown}</p>;
  const status = {
    fresh: copy.sourceSyncFresh,
    pending: copy.sourceSyncPending,
    error: copy.sourceSyncError,
  }[sync.status];
  return (
    <dl className="source-sync-details">
      <div>
        <dt>{copy.sourceSyncTitle}</dt>
        <dd>{status}</dd>
      </div>
      {sync.fetchedAt && (
        <div>
          <dt>{copy.sourceSyncFetched}</dt>
          <dd>{readableDate(sync.fetchedAt)}</dd>
        </div>
      )}
      {sync.version && (
        <div>
          <dt>{copy.sourceSyncVersion}</dt>
          <dd className="mono">{sync.version}</dd>
        </div>
      )}
      {sync.contentHash && (
        <div>
          <dt>{copy.sourceSyncHash}</dt>
          <dd className="mono">{sync.contentHash}</dd>
        </div>
      )}
      {sync.errorCode && (
        <div>
          <dt>{copy.sourceSyncProblem}</dt>
          <dd className="mono">{sync.errorCode}</dd>
        </div>
      )}
    </dl>
  );
}

export function SourceSync({
  source,
  canRefresh,
}: {
  source: SourceData;
  canRefresh: boolean;
}) {
  const [sync, setSync] = useState<Sync | null>(source.sync ?? null);
  const [operation, setOperation] = useState<Operation>("idle");
  const [feedback, setFeedback] = useState("");
  useEffect(() => setSync(source.sync ?? null), [source.sync]);
  const run = async (kind: "checking" | "refreshing") => {
    setOperation(kind);
    setFeedback(
      kind === "checking" ? copy.sourceSyncChecking : copy.sourceSyncRefreshing,
    );
    const result =
      kind === "checking"
        ? await api.sourceStatus(source.id)
        : await api.refreshSource(source.id);
    setOperation("idle");
    if (result.ok) {
      setSync(result.value);
      setFeedback(
        result.value.status === "error"
          ? copy.sourceSyncFetchFailed
          : kind === "refreshing"
            ? copy.sourceSyncRefreshDone
            : "",
      );
    } else {
      setFeedback(
        result.error.status === 403
          ? copy.sourceSyncAdminRequired
          : kind === "checking"
            ? copy.sourceSyncCheckFailed
            : copy.sourceSyncRefreshFailed,
      );
    }
  };
  return (
    <div className="source-sync">
      <SyncDetails sync={sync} />
      <div className="source-sync-actions">
        <button
          type="button"
          disabled={operation !== "idle"}
          onClick={() => void run("checking")}
        >
          {copy.sourceSyncCheck}
        </button>
        {canRefresh && (
          <button
            type="button"
            disabled={operation !== "idle"}
            onClick={() => void run("refreshing")}
          >
            {copy.sourceSyncRefresh}
          </button>
        )}
      </div>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
