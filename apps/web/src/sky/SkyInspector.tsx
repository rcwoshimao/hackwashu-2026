import { copy } from "@ground-control/copy";
import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import type { AccountRepoData, RunData, Satellite } from "../data.ts";
import {
  githubReadmeUrl,
  readableDate,
  repoPath,
  safeExternalUrl,
} from "../presentation.ts";

function useLatestRun(satellite: Satellite | null): {
  run: RunData | null;
  loading: boolean;
} {
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
      if (!repo.ok || !repo.value.latestRunId || controller.signal.aborted) {
        setLoading(false);
        return;
      }
      const latest = await api.run(repo.value.latestRunId, controller.signal);
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

function FactList({ run }: { run: RunData }) {
  if (run.evidence.length === 0)
    return <p className="quiet-copy">{copy.skyEvidenceNoFailures}</p>;
  return (
    <section className="fact-list">
      <h3>{copy.skyEvidenceTitle}</h3>
      {run.evidence.map((fact) => (
        <article className="fact" key={fact.factKey}>
          <h4>{fact.kind.replaceAll("_", " ")}</h4>
          {fact.claims.map((claim) => (
            <div
              className="fact-claim"
              key={`${fact.factKey}:${claim.claimId}:${claim.sourceId}`}
            >
              <p className="mono">{claim.sourceId}</p>
              <blockquote>{claim.quote}</blockquote>
              <dl>
                <div>
                  <dt>{copy.runExpected}</dt>
                  <dd>{claim.expected}</dd>
                </div>
                <div>
                  <dt>{copy.runActual}</dt>
                  <dd>{claim.actual}</dd>
                </div>
              </dl>
              {claim.deepLink && safeExternalUrl(claim.deepLink) && (
                <a
                  href={safeExternalUrl(claim.deepLink) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.commonOpen}
                </a>
              )}
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}

function RealMetrics({ satellite }: { satellite: Satellite }) {
  return (
    <dl className="metric-list">
      <div>
        <dt>{copy.skyCommit}</dt>
        <dd className="mono">{satellite.commitSha.slice(0, 12)}</dd>
      </div>
      <div>
        <dt>{copy.skyTiers}</dt>
        <dd>{satellite.tiersRun.join(", ") || copy.commonNone}</dd>
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
        <dt>{copy.skyDegrees}</dt>
        <dd className="mono">
          {satellite.driftDegrees.toFixed(1)} {copy.skyDegreesUnit}
        </dd>
      </div>
      <div>
        <dt>{copy.skyUpdated}</dt>
        <dd>{readableDate(satellite.scannedAt)}</dd>
      </div>
    </dl>
  );
}

function RealActions({ satellite }: { satellite: Satellite }) {
  return (
    <div className="inspector-actions">
      <a className="button" href={repoPath(satellite.repo)}>
        {copy.skyOpenRepo}
      </a>
      <a
        href={githubReadmeUrl(satellite.repo, satellite.commitSha)}
        target="_blank"
        rel="noreferrer"
      >
        {copy.skyReadme}
      </a>
    </div>
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
      <aside className="sky-inspector panel" aria-live="polite">
        <h2>{copy.skyInspectorTitle}</h2>
        <p>{copy.skySelectPrompt}</p>
      </aside>
    );
  return (
    <aside className="sky-inspector panel" aria-live="polite">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{copy.skyInspectorTitle}</p>
          <h2>{satellite.repo}</h2>
        </div>
        {satellite.simulated ? (
          <span className="simulation-tag">{copy.skyModeSimulated}</span>
        ) : (
          <StatusBadge label={satellite.label} />
        )}
      </div>
      {satellite.simulated && (
        <p className="simulation-note">{copy.skySimulatedNotice}</p>
      )}
      {!satellite.simulated &&
        satellite.label.toLowerCase() === "possible drift" && (
          <p className="simulation-note">{copy.skyPossibleDriftNotice}</p>
        )}
      {!satellite.simulated && <RealMetrics satellite={satellite} />}
      {account?.runtimeEnabled && account.checked && (
        <p className="sky-deep-status">
          {copy.skyDeepStatus}:{" "}
          <StatusBadge label={account.label ?? copy.statusNoTelemetry} />
        </p>
      )}
      {!satellite.simulated && <RealActions satellite={satellite} />}
      {loading ? (
        <p>{copy.skyEvidenceLoading}</p>
      ) : run ? (
        <FactList run={run} />
      ) : (
        !satellite.simulated && (
          <p className="quiet-copy">{copy.skyNoEvidence}</p>
        )
      )}
    </aside>
  );
}
