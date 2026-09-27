import { copy } from "@ground-control/copy";
import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import type { AccountRepoData, RunData, Satellite } from "../data.ts";
import { githubReadmeUrl, readableDate, repoPath } from "../presentation.ts";
import { summarizeRun } from "../repo/findingSummary.ts";
import { scanRunId } from "./scanRun.ts";

function useLatestRun(satellite: Satellite | null) {
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setRun(null);
    if (!satellite || satellite.simulated) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      const repo = await api.repo(satellite.repo, controller.signal);
      const runId = repo.ok
        ? scanRunId(repo.value.runs, satellite.commitSha)
        : null;
      if (!runId || controller.signal.aborted) {
        setLoading(false);
        return;
      }
      const latest = await api.run(runId, controller.signal);
      if (!controller.signal.aborted) {
        setRun(latest.ok ? latest.value : null);
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [satellite]);
  return { run, loading };
}

function RunPreview({ run }: { run: RunData }) {
  const summary = summarizeRun(run);
  const first = summary.confirmedItems[0] ?? summary.reviewItems[0];
  const count = summary.confirmedFailures || summary.needsReview;
  const label =
    summary.confirmedFailures > 0
      ? count === 1
        ? copy.skyPreviewConfirmed
        : copy.skyPreviewConfirmedMany
      : count === 1
        ? copy.skyPreviewReview
        : copy.skyPreviewReviews;
  return (
    <div className="sky-run-preview">
      <strong>
        {count > 0
          ? `${count} ${label}`
          : summary.passed > 0
            ? `${summary.passed} ${copy.skyPreviewPassed}`
            : copy.skyPreviewNoChecks}
      </strong>
      {first ? (
        <>
          <p>{copy.skyPreviewQuote}</p>
          <blockquote>{first.quote}</blockquote>
          {summary.needsReview > 0 && summary.confirmedFailures === 0 && (
            <p>{copy.skyPreviewNoCiFailure}</p>
          )}
        </>
      ) : (
        summary.passed > 0 && <p>{copy.repoNoMismatchExplanation}</p>
      )}
    </div>
  );
}

function tierLabel(tier: string): string {
  if (tier === "static") return copy.skyTierStatic;
  if (tier === "ai") return copy.skyTierAi;
  if (tier === "deep") return copy.skyTierDeep;
  return tier;
}

function ScanDetails({ satellite }: { satellite: Satellite }) {
  return (
    <details className="sky-scan-details">
      <summary>{copy.skyScanDetails}</summary>
      <dl className="metric-list">
        <div>
          <dt>{copy.skyCommit}</dt>
          <dd className="mono">{satellite.commitSha.slice(0, 12)}</dd>
        </div>
        <div>
          <dt>{copy.skyTiers}</dt>
          <dd>
            {satellite.tiersRun.map(tierLabel).join(" + ") || copy.commonNone}
          </dd>
        </div>
        <div>
          <dt>{copy.skyTopic}</dt>
          <dd>{satellite.topicCluster}</dd>
        </div>
        <div>
          <dt>{copy.skyStars}</dt>
          <dd className="mono">{satellite.stars.toLocaleString()}</dd>
        </div>
        <div>
          <dt>{copy.skyLag}</dt>
          <dd className="mono">
            {satellite.readmeLagDays.toLocaleString()} {copy.skyDaysUnit}
          </dd>
        </div>
        <div>
          <dt>{copy.skyUpdated}</dt>
          <dd>{readableDate(satellite.scannedAt)}</dd>
        </div>
      </dl>
    </details>
  );
}

export function SkyInspector({
  satellite,
  account,
}: {
  satellite: Satellite | null;
  account: AccountRepoData | null;
}) {
  const { run, loading } = useLatestRun(satellite);
  if (!satellite)
    return (
      <aside
        className="sky-inspector panel"
        id="selected-repo-panel"
        aria-live="polite"
      >
        <h2>{copy.skyInspectorTitle}</h2>
        <p>{copy.skySelectPrompt}</p>
      </aside>
    );
  return (
    <aside
      className="sky-inspector panel"
      id="selected-repo-panel"
      aria-live="polite"
    >
      <p className="eyebrow">{copy.skyInspectorIntro}</p>
      <h2>{satellite.repo}</h2>
      {satellite.simulated ? (
        <span className="simulation-tag">{copy.skyModeSimulated}</span>
      ) : (
        <StatusBadge label={satellite.label} />
      )}
      {satellite.simulated && <p>{copy.skySimulatedNotice}</p>}
      {!satellite.simulated && loading && <p>{copy.skyEvidenceLoading}</p>}
      {!satellite.simulated && run && <RunPreview run={run} />}
      {!satellite.simulated && !loading && !run && (
        <p className="quiet-copy">{copy.skyNoEvidence}</p>
      )}
      {account?.runtimeEnabled && account.checked && (
        <p className="sky-deep-status">
          {copy.skyDeepStatus}:{" "}
          <StatusBadge label={account.label ?? copy.statusNoTelemetry} />
        </p>
      )}
      {!satellite.simulated && (
        <>
          <div className="inspector-actions">
            <a className="button" href={`${repoPath(satellite.repo)}#findings`}>
              {run ? copy.skyOpenRepo : copy.skyOpenRepoResult}
            </a>
            <a
              href={githubReadmeUrl(satellite.repo, satellite.commitSha)}
              target="_blank"
              rel="noreferrer"
            >
              {copy.skyReadme}
            </a>
          </div>
          <ScanDetails satellite={satellite} />
        </>
      )}
    </aside>
  );
}
