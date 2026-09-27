import type { CorrectionPort } from "@ground-control/messaging";
import type { FlightPlan } from "@ground-control/plan";

export type FixErrorCode =
  | "not_connected"
  | "unsupported_drift"
  | "uncited_change"
  | "stale_plan"
  | "github_failed";

export type FixResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: FixErrorCode } };

export type FileChange = {
  path: string;
  before: string;
  after: string;
  citedLines: readonly number[];
  edits: readonly {
    startOffset: number;
    endOffset: number;
    replacement: string;
    claimId: string;
    sourceId: string;
  }[];
};

export type CorrectionProposal = {
  oldPort: number;
  newPort: number;
  files: readonly FileChange[];
  plan: FlightPlan | null;
  wikiSuggestions: readonly { sourceId: string; text: string }[];
  urlEvidence: readonly string[];
};

export type DraftInput = {
  repo: string;
  baseSha: string;
  branch: string;
  files: readonly { path: string; content: string }[];
  title: string;
  body: string;
};

export type DraftResult = {
  url: string;
  commitSha: string;
  branch: string;
};

export interface GitHubFixPort {
  readFile(repo: string, path: string, ref: string): Promise<FixResult<string>>;
  createDraft(input: DraftInput): Promise<FixResult<DraftResult>>;
  listFiles?(repo: string, ref: string): Promise<FixResult<readonly string[]>>;
  groundControlStatus(
    repo: string,
    commitSha: string,
  ): Promise<FixResult<"success" | "failure" | "pending">>;
}

export type CorrectionDelegate = CorrectionPort;
