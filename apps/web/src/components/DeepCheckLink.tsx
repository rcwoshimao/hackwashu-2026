import { copy } from "@ground-control/copy";
import type { MeData, RepoData } from "../data.ts";
import { readableDate } from "../presentation.ts";

export function canOpenDeepChecks(data: RepoData, me: MeData | null): boolean {
  if (!me?.signedIn) return false;
  if (data.visibility === "private")
    return me.connectedRepos.includes(data.repo);
  return data.repo.split("/")[0]?.toLowerCase() === me.login?.toLowerCase();
}

export function DeepCheckLink({
  data,
  me,
}: {
  data: RepoData;
  me: MeData | null;
}) {
  const latestCi =
    data.latestCiRun ?? data.runs.find((run) => run.origin === "ci");
  const canManage = canOpenDeepChecks(data, me);
  if (latestCi)
    return (
      <div className="deep-check-state">
        <p>
          <strong>{copy.deepChecksSetUp}</strong> ·{" "}
          {latestCi.verdict === "success"
            ? copy.deepChecksLastPassed
            : latestCi.verdict === "failure"
              ? copy.deepChecksLastFailed
              : copy.deepChecksLastPending}{" "}
          ·{" "}
          <time dateTime={latestCi.createdAt}>
            {readableDate(latestCi.createdAt)}
          </time>
        </p>
        <a href={`/runs/${encodeURIComponent(latestCi.id)}`}>
          {copy.deepChecksViewRun}
        </a>
        {canManage && (
          <a href={`/connect?repo=${encodeURIComponent(data.repo)}&runtime=1`}>
            {copy.deepChecksManageAction}
          </a>
        )}
      </div>
    );
  if (!canManage) return null;
  return (
    <div className="deep-check-state">
      {data.runtimeEnabled && <p>{copy.deepChecksNoCiResult}</p>}
      <a
        className="button deep-check-link"
        href={`/connect?repo=${encodeURIComponent(data.repo)}&runtime=1`}
      >
        {data.runtimeEnabled
          ? copy.deepChecksSetupAction
          : copy.deepScanAddAction}
      </a>
    </div>
  );
}
