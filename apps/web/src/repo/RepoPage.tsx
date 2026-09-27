import { copy } from "@ground-control/copy";
import { useMe } from "../auth/useMe.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import type { RepoData, SourceData } from "../data.ts";
import { readableDate, safeExternalUrl } from "../presentation.ts";
import { SourceSync } from "../sources/SourceSync.tsx";
import { RepoScanStatus } from "./RepoScanStatus.tsx";
import { Trajectory } from "./Trajectory.tsx";
import { useRepo } from "./useRepo.ts";

function DegreesDial({ degrees }: { degrees: number }) {
  const angle = (degrees * Math.PI) / 180;
  const endX = 20 + Math.cos(angle) * 140;
  const endY = 160 - Math.sin(angle) * 140;
  return (
    <div
      className="degrees-dial"
      role="img"
      aria-label={`${copy.repoDial}: ${degrees.toFixed(1)} ${copy.skyDegreesUnit}`}
    >
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <path d="M160 160 A140 140 0 0 0 20 20" className="dial-track" />
        {degrees > 0 && (
          <path
            d={`M160 160 A140 140 0 0 0 ${endX} ${endY}`}
            className="dial-value"
          />
        )}
      </svg>
      <div>
        <strong>{degrees.toFixed(1)}°</strong>
        <span>{copy.repoDial}</span>
      </div>
    </div>
  );
}

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
            {copy.commonOpen}
          </a>
        )}
      </div>
      <SourceSync source={source} canRefresh={canRefresh} />
    </li>
  );
}

function SourceList({ data }: { data: RepoData }) {
  const { me } = useMe();
  const canRefresh = me?.signedIn && me.connectedRepos.includes(data.repo);
  return (
    <section className="panel repo-sources">
      <div className="panel-heading">
        <h2>{copy.repoSources}</h2>
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

function RunList({ data }: { data: RepoData }) {
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
                        ? copy.commonSuccess
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

function RepoContent({ data }: { data: RepoData }) {
  return (
    <>
      <header className="repo-heading">
        <div>
          <p className="eyebrow">
            {data.visibility === "private" ? copy.repoPrivate : copy.repoPublic}
          </p>
          <h1>{data.repo}</h1>
          {data.visibility === "public" &&
          data.scan === null &&
          data.runs.length === 0 ? (
            <span className="status-badge no-telemetry">
              {copy.repoNotScanned}
            </span>
          ) : (
            <StatusBadge label={data.label} />
          )}
        </div>
        {data.runs.length > 0 && <DegreesDial degrees={data.driftDegrees} />}
      </header>
      <RepoScanStatus data={data} />
      <Trajectory repo={data} />
      <div className="repo-panels">
        <SourceList data={data} />
        <RunList data={data} />
      </div>
    </>
  );
}

export function RepoPage({ repo }: { repo: string }) {
  const { data, loading, denied } = useRepo(repo);
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
