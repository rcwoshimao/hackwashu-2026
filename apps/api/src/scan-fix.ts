import type { DocFixModel } from "@ground-control/ai";
import type { GitHubFixPort, ScanFixOutcome } from "@ground-control/fixes";
import { OctokitFixes, ScanCorrection } from "@ground-control/fixes";
import type { AppStore, RunRecord } from "@ground-control/store";
import type { EventHub } from "./types.ts";

export type ScanFixResult =
  | { ok: true; value: ScanFixOutcome }
  | { ok: false; error: { code: "unavailable" | "no_fix" } };

export interface ScanFixService {
  fix(
    run: RunRecord,
    claimIds: readonly string[],
    oauthToken?: string,
  ): Promise<ScanFixResult>;
}

export function openScanFindings(run: RunRecord): readonly string[] {
  return [
    ...new Set(
      run.results
        .filter((item) => item.status === "fail" && item.state !== "dropped")
        .map((item) => item.claimId),
    ),
  ];
}

export function createScanFix(config: {
  store: AppStore;
  events: EventHub;
  model: DocFixModel;
  serviceToken?: string | undefined;
  github?: (token: string) => GitHubFixPort;
  now?: () => Date;
}): ScanFixService {
  const correction = new ScanCorrection(config.model);
  const github = config.github ?? ((token) => new OctokitFixes(token));
  const now = config.now ?? (() => new Date());
  return {
    async fix(run, claimIds, oauthToken) {
      const token = oauthToken ?? config.serviceToken;
      if (!token) return { ok: false, error: { code: "unavailable" } };
      const drafted = await correction.fix(github(token), run, claimIds);
      if (!drafted.ok)
        return {
          ok: false,
          error: {
            code:
              drafted.error.code === "github_failed" ? "unavailable" : "no_fix",
          },
        };
      const at = now().toISOString();
      for (const claimId of drafted.value.fixedClaimIds)
        config.store.putClaimFix({
          repo: run.repo,
          claimId,
          pullRequestUrl: drafted.value.pullRequestUrl,
          createdAt: at,
        });
      config.events.publish(
        config.store.appendEvent("scan_fix_opened", at, {
          repo: run.repo,
          runId: run.id,
          pullRequestUrl: drafted.value.pullRequestUrl,
        }),
      );
      return drafted;
    },
  };
}
