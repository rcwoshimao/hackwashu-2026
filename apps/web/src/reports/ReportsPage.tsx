import { copy } from "@ground-control/copy";
import { useMe } from "../auth/useMe.ts";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { repoPath } from "../presentation.ts";
import { RunList } from "../repo/RepoPage.tsx";
import { useRepo } from "../repo/useRepo.ts";

function ReportCard({ repo }: { repo: string }) {
  const { data, loading } = useRepo(repo);
  return (
    <article className="report-card" aria-labelledby={`report-${repo}`}>
      <div className="report-head">
        <h2 id={`report-${repo}`}>
          <a href={repoPath(repo)}>{repo}</a>
        </h2>
        {data && <StatusBadge label={data.label} />}
      </div>
      {loading ? (
        <p role="status">{copy.commonLoading}</p>
      ) : !data ? (
        <p role="alert">{copy.repoUnavailable}</p>
      ) : (
        <>
          <p className="report-meta">
            {copy.reportsDocuments}:{" "}
            <span className="mono">{data.sources.length}</span>
            <a href={`/sources/new?repo=${encodeURIComponent(repo)}`}>
              {copy.reportsAddDocument}
            </a>
            <a href={repoPath(repo)}>{copy.reportsOpenRepo}</a>
          </p>
          <RunList data={data} />
        </>
      )}
    </article>
  );
}

function Reports({ repos }: { repos: string[] }) {
  if (repos.length === 0)
    return (
      <div className="state-panel panel">
        <p>{copy.reportsEmpty}</p>
        <a className="button" href="/connect">
          {copy.reportsConnect}
        </a>
      </div>
    );
  return (
    <div className="report-list">
      {repos.map((repo) => (
        <ReportCard key={repo} repo={repo} />
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { me, loading, failed } = useMe();
  return (
    <main className="page reports-page">
      <div className="reports-header">
        <div>
          <h1>{copy.reportsTitle}</h1>
          <p>{copy.reportsIntro}</p>
        </div>
        {me?.signedIn && (
          <a className="button" href="/connect">
            {copy.reportsConnect}
          </a>
        )}
      </div>
      {loading ? (
        <p role="status">{copy.commonLoading}</p>
      ) : failed ? (
        <p role="alert">{copy.signInUnavailable}</p>
      ) : me?.signedIn ? (
        <Reports repos={me.connectedRepos} />
      ) : (
        <div className="state-panel panel">
          <p>{copy.reportsSignIn}</p>
          <a className="button" href="/auth/github">
            {copy.signInAction}
          </a>
        </div>
      )}
    </main>
  );
}
