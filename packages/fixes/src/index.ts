export { CompositeCorrection } from "./composite.ts";
export { DeepCorrection } from "./deep-correction.ts";
export { FakeGitHubFixes, OctokitFixes } from "./github.ts";
export type { PrCommentPort, PrCommentResult } from "./pr-comment.ts";
export { commentOnConfirmedDrift, prEvidenceMarker } from "./pr-comment.ts";
export { FakePrComments, OctokitPrComments } from "./pr-comment-github.ts";
export { proposeCorrection } from "./proposal.ts";
export { rebaseFlightPlan } from "./rebase-plan.ts";
export { RepoCorrection } from "./repo-correction.ts";
export type { ScanFixOutcome } from "./scan-correction.ts";
export { ScanCorrection } from "./scan-correction.ts";
export type {
  CorrectionProposal,
  DraftInput,
  DraftResult,
  FileChange,
  FixErrorCode,
  FixResult,
  GitHubFixPort,
} from "./types.ts";
