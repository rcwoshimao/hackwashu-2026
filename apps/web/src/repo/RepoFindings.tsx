import { copy } from "@ground-control/copy";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.ts";
import { useMe } from "../auth/useMe.ts";
import type { CheckResult, RepoData, RunData } from "../data.ts";
import { safeExternalUrl } from "../presentation.ts";
import { canTriage, FindingActions, FixAllButton } from "./FindingActions.tsx";
import { type FindingSummary, summarizeRun } from "./findingSummary.ts";

function useLatestRun(id: string | null, version: unknown) {
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(id !== null);
  const refresh = useCallback(async () => {
    if (!id) return;
    const result = await api.run(id);
    if (result.ok) setRun(result.value);
  }, [id]);
  // `version` changes whenever the repo payload reloads (trust or fix events),
  // so the saved findings stay in step with the repo label.
  // biome-ignore lint/correctness/useExhaustiveDependencies: version is a reload signal
  useEffect(() => {
    if (!id) {
      setRun(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void api.run(id, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setRun(result.ok ? result.value : null);
      setLoading(false);
    });
    return () => controller.abort();
  }, [id, version]);
  return { run, loading, refresh };
}

function FindingCard({
  run,
  result,
  canAct,
  onChange,
}: {
  run: RunData;
  result: CheckResult;
  canAct: boolean;
  onChange: () => Promise<void>;
}) {
  const confirmed = result.state === "confirmed";
  const link = result.deepLink ? safeExternalUrl(result.deepLink) : null;
  return (
    <li className="repo-finding-card">
      <span className={confirmed ? "drift-ink" : "finding-review-tag"}>
        {confirmed ? copy.repoFindingConfirmed : copy.repoFindingNeedsReview}
      </span>
      <blockquote>{result.quote}</blockquote>
      <p>
        {result.kind === "file_exists"
          ? copy.repoFindingMissingPath
          : copy.repoFindingOther}
      </p>
      {link && (
        <a href={link} target="_blank" rel="noreferrer">
          {copy.repoFindingOpenSource}
        </a>
      )}
      <FindingActions
        run={run}
        result={result}
        canAct={canAct}
        onChange={onChange}
      />
    </li>
  );
}

function resultTitle(summary: FindingSummary): string {
  if (summary.outcome === "confirmed_drift")
    return summary.confirmedFailures === 1
      ? copy.repoConfirmedOne
      : `${summary.confirmedFailures} ${copy.repoConfirmedMany}`;
  if (summary.outcome === "needs_review")
    return summary.needsReview === 1
      ? copy.repoReviewOne
      : `${summary.needsReview} ${copy.repoReviewMany}`;
  return summary.outcome === "unverified"
    ? copy.repoNoVerdict
    : copy.repoNoMismatch;
}

function ResultCounts({ summary }: { summary: FindingSummary }) {
  return (
    <dl className="repo-result-counts">
      <div>
        <dt>{copy.repoPassedChecks}</dt>
        <dd>{summary.passed}</dd>
      </div>
      <div>
        <dt>{copy.repoNeedsReview}</dt>
        <dd>{summary.needsReview}</dd>
      </div>
      <div>
        <dt>{copy.repoUnverifiedChecks}</dt>
        <dd>{summary.unverified}</dd>
      </div>
    </dl>
  );
}

function ResultBody({
  run,
  onChange,
}: {
  run: RunData;
  onChange: () => Promise<void>;
}) {
  const { me } = useMe();
  const canAct = canTriage(run, me);
  const summary = summarizeRun(run);
  const findings = [...summary.confirmedItems, ...summary.reviewItems];
  const explanation = {
    confirmed_drift: copy.repoConfirmedExplanation,
    needs_review: copy.repoReviewExplanation,
    no_confirmed_drift: copy.repoNoMismatchExplanation,
    unverified: copy.repoScanLimited,
  }[summary.outcome];
  return (
    <>
      <h2>{resultTitle(summary)}</h2>
      <p>{explanation}</p>
      <ResultCounts summary={summary} />
      <FixAllButton
        run={run}
        findings={findings}
        canAct={canAct}
        onChange={onChange}
      />
      {findings.length > 0 && (
        <ul className="repo-finding-list">
          {findings.slice(0, 5).map((item) => (
            <FindingCard
              key={item.claimId}
              run={run}
              result={item}
              canAct={canAct}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
      {findings.length > 5 && <p>{copy.repoFindingsMore}</p>}
      <a href={`/runs/${encodeURIComponent(run.id)}`}>
        {copy.repoFindingOpenRun}
      </a>
    </>
  );
}

export function RepoFindings({ data }: { data: RepoData }) {
  const { run, loading, refresh } = useLatestRun(data.latestRunId, data);
  return (
    <section
      className="panel repo-result"
      id="findings"
      aria-label={copy.repoResultTitle}
    >
      <p className="eyebrow">{copy.repoResultTitle}</p>
      {loading ? (
        <p role="status">{copy.repoFindingLoading}</p>
      ) : run ? (
        <ResultBody run={run} onChange={refresh} />
      ) : (
        <h2>{copy.repoNoVerdict}</h2>
      )}
    </section>
  );
}
