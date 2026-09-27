import { copy } from "@ground-control/copy";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.ts";
import { useMe } from "../auth/useMe.ts";
import type { CheckResult, RunData } from "../data.ts";
import { readableDate, repoPath, safeExternalUrl } from "../presentation.ts";
import {
  canTriage,
  FindingActions,
  FixAllButton,
  RestoreButton,
} from "../repo/FindingActions.tsx";
import { DeepFixButton } from "./DeepFixButton.tsx";

function useRun(id: string) {
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const refresh = useCallback(async () => {
    const result = await api.run(id);
    setData(result.ok ? result.value : null);
    setDenied(!result.ok && result.error.code === "access");
    setLoading(false);
  }, [id]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, denied, refresh };
}

function trustText(state: string): string {
  return (
    {
      unconfirmed: copy.runStateUnconfirmed,
      confirmed: copy.runStateConfirmed,
      disputed: copy.runStateDisputed,
      dropped: copy.runStateDropped,
    }[state as "unconfirmed"] ?? state
  );
}

function resultText(status: string): string {
  return (
    {
      pass: copy.runPass,
      fail: copy.runFail,
      skipped: copy.runSkipped,
      unverified: copy.runUnverified,
    }[status as "pass"] ?? status
  );
}

function EvidenceGroups({ data }: { data: RunData }) {
  return (
    <section className="panel evidence-groups">
      <h2>{copy.runEvidence}</h2>
      {data.evidence.length === 0 ? (
        <p>{copy.runNoEvidence}</p>
      ) : (
        data.evidence.map((group) => (
          <article className="evidence-group" key={group.factKey}>
            <h3>
              {group.kind.replaceAll("_", " ")}{" "}
              <span className="mono">{group.claims.length}</span>
            </h3>
            {group.claims.map((claim) => (
              <div
                className="evidence-claim"
                key={`${group.factKey}:${claim.claimId}:${claim.sourceId}`}
              >
                <p className="eyebrow">{claim.sourceId}</p>
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
                    {copy.runOpenSource}
                  </a>
                )}
              </div>
            ))}
          </article>
        ))
      )}
    </section>
  );
}

function CheckCard({
  result,
  run,
  canAct,
  canDeepFix,
  onChange,
}: {
  result: CheckResult;
  run: RunData;
  canAct: boolean;
  canDeepFix: boolean;
  onChange: () => Promise<void>;
}) {
  const runId = run.id;
  const scanFinding = run.origin === "public_scan";
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const action = async (kind: "confirm" | "drop") => {
    setPending(true);
    const response =
      kind === "confirm"
        ? await api.confirm(runId, result.claimId)
        : await api.drop(runId, result.claimId);
    setFeedback(
      response.ok
        ? kind === "confirm"
          ? copy.runConfirmDone
          : copy.runDropDone
        : copy.runActionFailed,
    );
    if (response.ok) await onChange();
    setPending(false);
  };
  const actionable =
    !scanFinding &&
    (result.state === "unconfirmed" || result.state === "disputed");
  const link = result.deepLink ? safeExternalUrl(result.deepLink) : null;
  return (
    <li
      className={`check-card ${result.status === "fail" ? "check-failed" : ""}`}
    >
      <div className="check-heading">
        <strong>{result.sourceId}</strong>
        <span>
          {resultText(result.status)} · {trustText(result.state)}
        </span>
      </div>
      <blockquote>{result.quote}</blockquote>
      <dl>
        <div>
          <dt>{copy.runExpected}</dt>
          <dd>{result.expected}</dd>
        </div>
        <div>
          <dt>{copy.runActual}</dt>
          <dd>{result.actual}</dd>
        </div>
      </dl>
      <div className="check-actions">
        {link && (
          <a href={link} target="_blank" rel="noreferrer">
            {copy.runOpenSource}
          </a>
        )}
        {actionable && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => void action("confirm")}
            >
              {copy.runConfirm}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void action("drop")}
            >
              {copy.runDrop}
            </button>
          </>
        )}
        {run.origin === "ci" &&
          canDeepFix &&
          result.state === "confirmed" &&
          result.status === "fail" && (
            <DeepFixButton runId={runId} claimId={result.claimId} />
          )}
      </div>
      {scanFinding && (
        <>
          <FindingActions
            run={run}
            result={result}
            canAct={canAct}
            onChange={onChange}
          />
          <RestoreButton
            run={run}
            result={result}
            canAct={canAct}
            onChange={onChange}
          />
        </>
      )}
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
    </li>
  );
}

function RunContent({
  data,
  refresh,
}: {
  data: RunData;
  refresh: () => Promise<void>;
}) {
  const { me } = useMe();
  const canAct = canTriage(data, me);
  const canDeepFix =
    data.origin === "ci" && !!me?.connectedRepos.includes(data.repo);
  return (
    <>
      <header className="detail-heading">
        <p className="eyebrow">{copy.runTitle}</p>
        <h1>{data.repo}</h1>
        <div className="run-meta">
          <span className="mono">{data.commitSha.slice(0, 12)}</span>
          <span>{readableDate(data.createdAt)}</span>
          <strong className={data.verdict === "failure" ? "drift-ink" : ""}>
            {data.verdict === "failure"
              ? copy.commonFailure
              : data.verdict === "success"
                ? copy.runNoConfirmedFailures
                : copy.commonPending}
          </strong>
        </div>
        <a href={repoPath(data.repo)}>{copy.skyOpenRepoResult}</a>
      </header>
      <EvidenceGroups data={data} />
      <section className="panel check-results">
        <h2>{copy.runChecks}</h2>
        {canDeepFix && <p>{copy.runDeepFixIntro}</p>}
        <FixAllButton
          run={data}
          findings={data.results}
          canAct={canAct}
          onChange={refresh}
        />
        {data.results.length === 0 ? (
          <p>{copy.runNoChecks}</p>
        ) : (
          <ol>
            {data.results.map((result) => (
              <CheckCard
                key={result.claimId}
                result={result}
                run={data}
                canAct={canAct}
                canDeepFix={canDeepFix}
                onChange={refresh}
              />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export function RunPage({ id }: { id: string }) {
  const { data, loading, denied, refresh } = useRun(id);
  return (
    <main className="page run-page">
      {loading && (
        <p className="state-panel" role="status">
          {copy.runLoading}
        </p>
      )}
      {!loading && !data && (
        <div className="state-panel">
          <h1>{copy.runUnavailable}</h1>
          {denied && <p>{copy.runAccessDenied}</p>}
          {denied && (
            <a className="button" href="/signin">
              {copy.navSignIn}
            </a>
          )}
        </div>
      )}
      {data && <RunContent data={data} refresh={refresh} />}
    </main>
  );
}
