import { copy } from "@ground-control/copy";
import type { MeData, RepoData } from "../data.ts";

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
  if (!canOpenDeepChecks(data, me)) return null;
  return (
    <a
      className="button deep-check-link"
      href={`/connect?repo=${encodeURIComponent(data.repo)}&runtime=1`}
    >
      {data.runtimeEnabled
        ? copy.deepChecksSetupAction
        : copy.deepScanAddAction}
    </a>
  );
}
