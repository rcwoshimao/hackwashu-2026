import type {
  AlertRecord,
  CorrectionPort,
  FixOutcome,
  Result,
} from "@ground-control/messaging";
import { renderMessage } from "@ground-control/messaging";
import { planToTests } from "@ground-control/plan";
import type { AppStore, RunRecord } from "@ground-control/store";
import { proposeCorrection } from "./proposal.ts";
import type {
  CorrectionProposal,
  DraftInput,
  DraftResult,
  GitHubFixPort,
} from "./types.ts";

function unpublished(proposal: CorrectionProposal): FixOutcome {
  const delivered = [
    ...proposal.wikiSuggestions.map((item) => item.sourceId),
    ...proposal.urlEvidence,
  ];
  return {
    verified: false,
    delivered,
    unavailable: [],
    pullRequestUrl: null,
    passedCheckCount: 0,
    wikiSuggestions: proposal.wikiSuggestions,
    urlEvidence: proposal.urlEvidence,
  };
}

function draftFiles(
  proposal: CorrectionProposal,
): readonly { path: string; content: string }[] {
  if (!proposal.plan) return [];
  return [
    ...proposal.files.map((file) => ({ path: file.path, content: file.after })),
    {
      path: "flightchecks/flightplan.json",
      content: `${JSON.stringify(proposal.plan, null, 2)}\n`,
    },
    {
      path: "flightchecks/flight.test.mjs",
      content: planToTests(proposal.plan),
    },
  ];
}

function draftInput(
  alert: AlertRecord,
  run: RunRecord,
  proposal: CorrectionProposal,
): DraftInput {
  return {
    repo: run.repo,
    baseSha: run.commitSha,
    branch: `groundcontrol/fix-${alert.id.replace(/[^A-Za-z0-9_-]/gu, "-").slice(0, 48)}`,
    files: draftFiles(proposal),
    title: renderMessage("fixPrTitle", {
      oldPort: proposal.oldPort,
      newPort: proposal.newPort,
    }),
    body: renderMessage("fixPrBody", {
      oldPort: proposal.oldPort,
      newPort: proposal.newPort,
      citations: proposal.files
        .map((file) => `${file.path}:${file.citedLines.join(",")}`)
        .join("; "),
    }),
  };
}

function publishedOutcome(
  proposal: CorrectionProposal,
  draft: DraftResult,
): FixOutcome {
  const fileSources = proposal.files.flatMap((file) =>
    file.edits.map((edit) => edit.sourceId),
  );
  return {
    ...unpublished(proposal),
    delivered: [
      ...new Set([
        ...fileSources,
        ...proposal.wikiSuggestions.map((item) => item.sourceId),
        ...proposal.urlEvidence,
      ]),
    ],
    pullRequestUrl: draft.url,
    correctionCommitSha: draft.commitSha,
    pendingCi: true,
  };
}

export class RepoCorrection implements CorrectionPort {
  constructor(private readonly github: GitHubFixPort) {}

  async fix(
    alert: AlertRecord,
    run: RunRecord,
    store: AppStore,
  ): Promise<Result<FixOutcome>> {
    if (store.getRepo(alert.repo)?.connected !== true)
      return { ok: false, error: { code: "unavailable" } };
    const proposed = await proposeCorrection(this.github, alert, run, store);
    if (!proposed.ok) return { ok: false, error: { code: "unavailable" } };
    const proposal = proposed.value;
    if (proposal.files.length === 0)
      return { ok: true, value: unpublished(proposal) };
    const published = await this.github.createDraft(
      draftInput(alert, run, proposal),
    );
    if (!published.ok) return { ok: false, error: { code: "unavailable" } };
    return { ok: true, value: publishedOutcome(proposal, published.value) };
  }

  async verifyDraft(
    repo: string,
    commitSha: string,
  ): Promise<Result<"success" | "failure" | "pending">> {
    const status = await this.github.groundControlStatus(repo, commitSha);
    return status.ok
      ? { ok: true, value: status.value }
      : { ok: false, error: { code: "unavailable" } };
  }
}
