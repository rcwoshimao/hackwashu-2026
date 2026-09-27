import { copy } from "@ground-control/copy";
import { useEffect } from "react";
import { useMe } from "../auth/useMe.ts";
import {
  canOpenDeepChecks,
  DeepCheckLink,
} from "../components/DeepCheckLink.tsx";
import type { MeData, RepoData, RunData, SourceData } from "../data.ts";
import { readableDate, safeExternalUrl } from "../presentation.ts";
import { SourceSync } from "../sources/SourceSync.tsx";
import { RepoChecklist } from "./RepoChecklist.tsx";
import { RepoSummary } from "./RepoSummary.tsx";
import { Trajectory } from "./Trajectory.tsx";
import { useLatestRun } from "./useLatestRun.ts";
import { useRepo } from "./useRepo.ts";

function SourceRow({
  source,
  canRefresh,
}: {
  source: SourceData;
  canRefresh: boolean;
}) {
  const link = safeExternalUrl(source.url);
  return (
    <li>
      <div className="source-row-top">
        <div>
          <strong>{source.title}</strong>
          <span>
            {source.kind} · {source.claimCount.toLocaleString()}{" "}
            {copy.sourceClaims}
          </span>
        </div>
        {link && (
          <a href={link} target="_blank" rel="noreferrer">
            {copy.repoSourceOpen}
          </a>
        )}
      </div>
      <details className="repo-source-details">
        <summary>{copy.repoSourceDetails}</summary>
        <SourceSync source={source} canRefresh={canRefresh} />
      </details>
    </li>
  );
}

function SourceList({ data }: { data: RepoData }) {
  const { me } = useMe();
  const canRefresh = me?.signedIn && me.connectedRepos.includes(data.repo);
  return (
    <section className="repo-sources">
      <div className="panel-heading">
        <h3>{copy.repoOtherDocs}</h3>
        <a href={`/sources/new?repo=${encodeURIComponent(data.repo)}`}>
          {copy.repoAddSource}
        </a>
      </div>
      {data.sources.length === 0 ? (
        <p>{copy.repoNoSources}</p>
      ) : (
        <ul className="source-list">
          {data.sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              canRefresh={!!canRefresh}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function RunList({ data }: { data: RepoData }) {
  return (
    <section className="panel repo-runs">
      <h2>{copy.repoRuns}</h2>
      {data.runs.length === 0 ? (
        <p>{copy.repoNoRuns}</p>
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

const methodNames: Record<string, string> = {
  static: copy.repoMethodStatic,
  ai: copy.repoMethodAi,
  runtime: copy.repoMethodDeep,
};

function RepoDetails({ data, run }: { data: RepoData; run: RunData | null }) {
  const tiers = data.scan?.tiersRun ?? [];
  return (
    <details className="repo-details">
      <summary>{copy.repoDetailsTitle}</summary>
      {run && (
        <dl className="repo-details-facts">
          <div>
            <dt>{copy.repoDetailsCommit}</dt>
            <dd className="mono">{run.commitSha.slice(0, 10)}</dd>
          </div>
          {tiers.length > 0 && (
            <div>
              <dt>{copy.repoDetailsMethods}</dt>
              <dd>
                {tiers.map((tier) => methodNames[tier] ?? tier).join(", ")}
              </dd>
            </div>
          )}
        </dl>
      )}
      <SourceList data={data} />
      {data.runs.length > 1 && <Trajectory repo={data} />}
      {data.runs.length > 0 && <RunList data={data} />}
    </details>
  );
}

/** Only owners (or connected private repos) get the deep-check setup offer. */
function OwnerPrompt({ data, me }: { data: RepoData; me: MeData | null }) {
  if (!canOpenDeepChecks(data, me)) return null;
  return (
    <aside className="repo-owner">
      <p>
        <strong>{copy.repoOwnerTitle}</strong> {copy.repoOwnerBody}
      </p>
      <DeepCheckLink data={data} me={me} />
    </aside>
  );
}

function RepoContent({ data }: { data: RepoData }) {
  const { me } = useMe();
  const { run, loading } = useLatestRun(data.latestRunId);
  const github = safeExternalUrl(`https://github.com/${data.repo}`);
  return (
    <>
      <a className="repo-back-link" href="/sky">
        {copy.repoBackToSky}
      </a>
      <header className="repo-heading">
        <p className="eyebrow">
          {data.visibility === "private" ? copy.repoPrivate : copy.repoPublic}
        </p>
        <h1>{data.repo}</h1>
        {github && (
          <a href={github} target="_blank" rel="noreferrer">
            {copy.repoOpenGithub}
          </a>
        )}
      </header>
      {loading ? (
        <p className="state-panel" role="status">
          {copy.repoFindingLoading}
        </p>
      ) : (
        <>
          <RepoSummary data={data} run={run} />
          {run && <RepoChecklist run={run} />}
        </>
      )}
      <OwnerPrompt data={data} me={me} />
      <RepoDetails data={data} run={run} />
    </>
  );
}

export function RepoPage({ repo }: { repo: string }) {
  const { data, loading, denied } = useRepo(repo);
  useEffect(() => {
    if (!data || window.location.hash !== "#findings") return;
    window.requestAnimationFrame(() =>
      document.getElementById("findings")?.scrollIntoView({ block: "start" }),
    );
  }, [data]);
  return (
    <main className="page repo-page">
      {loading && (
        <p className="state-panel" role="status">
          {copy.repoLoading}
        </p>
      )}
      {!loading && !data && (
        <div className="state-panel">
          <h1>{copy.repoUnavailable}</h1>
          <p>{denied ? copy.repoAccessDenied : copy.repoUnavailable}</p>
          {denied && (
            <a className="button" href="/signin">
              {copy.navSignIn}
            </a>
          )}
        </div>
      )}
      {data && <RepoContent data={data} />}
    </main>
  );
}
