import type { DocFixModel } from "@ground-control/ai";
import type { GitHubFixPort } from "@ground-control/fixes";
import { DeepCorrection, OctokitFixes } from "@ground-control/fixes";
import type { DeepFixPort } from "./types.ts";

export function createDeepFix(
  model: DocFixModel,
  github: (token: string) => GitHubFixPort = (token) => new OctokitFixes(token),
): DeepFixPort {
  const correction = new DeepCorrection(model);
  return {
    async fix(run, claimIds, oauthToken) {
      const result = await correction.fix(github(oauthToken), run, claimIds);
      if (!result.ok)
        return {
          ok: false,
          reason:
            result.error.code === "github_failed" ? "unavailable" : "no_fix",
        };
      return {
        ok: true,
        url: result.value.url,
        fixedClaimIds: result.value.fixedClaimIds,
      };
    },
  };
}
