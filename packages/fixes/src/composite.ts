import type {
  AlertRecord,
  CorrectionPort,
  FixOutcome,
  Result,
} from "@ground-control/messaging";
import type { AppStore, RunRecord } from "@ground-control/store";

function scoped(
  alert: AlertRecord,
  run: RunRecord,
  sourceIds: readonly string[],
): AlertRecord {
  return {
    ...alert,
    sourceIds,
    claimIds: alert.claimIds.filter((id) =>
      run.results.some(
        (claim) => claim.claimId === id && sourceIds.includes(claim.sourceId),
      ),
    ),
  };
}

function failed(sourceIds: readonly string[]): FixOutcome {
  return {
    verified: false,
    delivered: [],
    unavailable: sourceIds,
    pullRequestUrl: null,
    passedCheckCount: 0,
  };
}

export class CompositeCorrection implements CorrectionPort {
  constructor(
    private readonly repo: CorrectionPort,
    private readonly confluence: CorrectionPort | null,
  ) {}

  async fix(
    alert: AlertRecord,
    run: RunRecord,
    store: AppStore,
  ): Promise<Result<FixOutcome>> {
    if (store.getRepo(alert.repo)?.connected !== true)
      return { ok: false, error: { code: "unavailable" } };
    const confluenceIds = alert.sourceIds.filter(
      (id) => store.getSource(id)?.kind === "confluence",
    );
    const repoIds = alert.sourceIds.filter((id) => !confluenceIds.includes(id));
    const [repoResult, confluenceResult] = await Promise.all([
      repoIds.length > 0
        ? this.repo.fix(scoped(alert, run, repoIds), run, store)
        : Promise.resolve({ ok: true as const, value: failed([]) }),
      confluenceIds.length > 0 && this.confluence
        ? this.confluence.fix(scoped(alert, run, confluenceIds), run, store)
        : Promise.resolve({ ok: true as const, value: failed(confluenceIds) }),
    ]);
    const repoOutcome = repoResult.ok ? repoResult.value : failed(repoIds);
    const pageOutcome = confluenceResult.ok
      ? confluenceResult.value
      : failed(confluenceIds);
    const delivered = [...repoOutcome.delivered, ...pageOutcome.delivered];
    const unavailable = [
      ...repoOutcome.unavailable,
      ...pageOutcome.unavailable,
    ];
    return {
      ok: true,
      value: {
        verified: repoOutcome.verified,
        delivered,
        unavailable,
        pullRequestUrl: repoOutcome.pullRequestUrl,
        passedCheckCount: repoOutcome.passedCheckCount,
        ...(repoOutcome.pendingCi ? { pendingCi: true } : {}),
        ...(repoOutcome.correctionCommitSha
          ? { correctionCommitSha: repoOutcome.correctionCommitSha }
          : {}),
        ...(repoOutcome.wikiSuggestions
          ? { wikiSuggestions: repoOutcome.wikiSuggestions }
          : {}),
        ...(repoOutcome.urlEvidence
          ? { urlEvidence: repoOutcome.urlEvidence }
          : {}),
      },
    };
  }

  async verifyDraft(
    repo: string,
    commitSha: string,
  ): Promise<Result<"success" | "failure" | "pending">> {
    return this.repo.verifyDraft
      ? this.repo.verifyDraft(repo, commitSha)
      : { ok: false, error: { code: "unavailable" } };
  }
}
