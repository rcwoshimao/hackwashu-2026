import { copy } from "@ground-control/copy";
import { useEffect } from "react";
import { useMe } from "../auth/useMe.ts";
import {
  canOpenDeepChecks,
  DeepCheckLink,
} from "../components/DeepCheckLink.tsx";
import type { MeData, RepoData, RunData, SourceData } from "../data.ts";
import { safeExternalUrl } from "../presentation.ts";
import { SourceSync } from "../sources/SourceSync.tsx";
import { RepoChecklist } from "./RepoChecklist.tsx";
import { RepoSummary } from "./RepoSummary.tsx";
import { RunList } from "./RunList.tsx";
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

const methodNames: Record<string, string> = {
  static: copy.repoMethodStatic,
  ai: copy.repoMethodAi,
  runtime: copy.repoMethodDeep,
};

function RepoDetails({
  data,
  run,
  onClear,
}: {
  data: RepoData;
  run: RunData | null;
  onClear: () => void;
}) {
  const { me } = useMe();
  const canClear =
    !!me?.signedIn &&
    (me.connectedRepos.includes(data.repo) ||
      data.repo.split("/")[0]?.toLowerCase() === me.login?.toLowerCase());
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
      <RunList data={data} canClear={canClear} onClear={onClear} />
    </details>
  );
}

/** Only owners (or connected private repos) get the deep-check setup offer. */
function OwnerPrompt({ data, me }: { data: RepoData; me: MeData | null }) {
  if (!canOpenDeepChecks(data, me)) return null;
  const needsSetup =
    !data.runtimeEnabled &&
    !(data.latestCiRun ?? data.runs.find((run) => run.origin === "ci"));
  return (
    <aside className="repo-owner">
      {needsSetup && (
        <p>
          <strong>{copy.repoOwnerTitle}</strong> {copy.repoOwnerBody}
        </p>
      )}
      <DeepCheckLink data={data} me={me} />
    </aside>
  );
}

function RepoContent({
  data,
  onClear,
}: {
  data: RepoData;
  onClear: () => void;
}) {
  const { me } = useMe();
  const { run, loading, refresh } = useLatestRun(data.latestRunId);
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
          {run && <RepoChecklist run={run} onChange={refresh} />}
        </>
      )}
      <OwnerPrompt data={data} me={me} />
      <RepoDetails data={data} run={run} onClear={onClear} />
    </>
  );
}

export function RepoPage({ repo }: { repo: string }) {
  const { data, loading, denied, refresh } = useRepo(repo);
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
      {data && <RepoContent data={data} onClear={refresh} />}
    </main>
  );
}
