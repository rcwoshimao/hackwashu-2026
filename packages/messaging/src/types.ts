import type { AppStore, RunRecord } from "@ground-control/store";

export type MessageError = {
  code:
    | "unconfigured"
    | "send_failed"
    | "invalid_input"
    | "not_found"
    | "unavailable";
};
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: MessageError };

export type LinkTokenRecord = {
  hash: string;
  githubLogin: string;
  addressHash: string;
  routeHash: string;
  recipientIdHash?: string;
  lineHash?: string;
  encryptedAddress: string;
  expiresAt: number;
};
export type LinkRecord = {
  githubLogin: string;
  senderHash: string;
  addressHash: string;
  encryptedAddress: string;
  encryptedChatId: string;
  encryptedLinePhone?: string;
};
export type AlertState = "open" | "kept" | "ignored" | "fixing" | "fixed";
export type AlertRecord = {
  id: string;
  kind?: "drift" | "scan";
  githubLogin: string;
  repo: string;
  commitSha: string;
  runId: string;
  claimIds: readonly string[];
  sourceIds: readonly string[];
  state: AlertState;
  delivery: "reserved" | "sent" | "failed";
  createdAt: string;
  correctionCommitSha?: string;
  pullRequestUrl?: string;
};
export type PendingChoice = {
  action: "fix" | "keep" | "ignore";
  alertIds: readonly string[];
};
export type OwnedClaim = {
  githubLogin: string;
  claimId: string;
  repo: string;
  runId: string;
  at: string;
};

export interface MessagingStore {
  putLinkToken(token: LinkTokenRecord): void;
  consumeLinkToken(
    hash: string,
    senderHash: string,
    addressHash: string | null,
    routeHash: string,
    lineHash: string | null,
    nowMs: number,
  ): LinkTokenRecord | null;
  putLink(link: LinkRecord): void;
  getLinkByGithub(login: string): LinkRecord | null;
  getLinkBySender(
    senderHash: string,
    addressHash: string | null,
  ): LinkRecord | null;
  deleteLink(hash: string): void;
  claimInbound(messageId: string): boolean;
  reserveAlert(alert: AlertRecord): boolean;
  getAlert(id: string): AlertRecord | null;
  putAlert(alert: AlertRecord): void;
  listAlerts(login: string): readonly AlertRecord[];
  findCorrection(repo: string, commitSha: string): AlertRecord | null;
  isIgnored(repo: string, claimId: string): boolean;
  ignore(repo: string, claimId: string): void;
  unignore(repo: string, claimId: string): void;
  getPending(hash: string): PendingChoice | null;
  putPending(hash: string, choice: PendingChoice | null): void;
  putOwnedClaims(login: string, run: RunRecord): void;
  findOwnedClaim(login: string, claimId: string): OwnedClaim | null;
}

export type InboundMessage = {
  id: string;
  senderId: string;
  senderAddress?: string;
  chatId: string;
  linePhone?: string;
  text: string;
};

export type ReplyRoute = Pick<InboundMessage, "chatId" | "linePhone">;
export type OutboundRoute = {
  chatId: string;
  recipientId?: string;
  linePhone?: string;
};

export interface IMessagePort {
  send(
    recipientAddress: string,
    text: string,
    linePhone?: string,
  ): Promise<Result<OutboundRoute>>;
  reply(
    chatId: string,
    text: string,
    linePhone?: string,
  ): Promise<Result<void>>;
}

export type FixOutcome = {
  verified: boolean;
  delivered: readonly string[];
  unavailable: readonly string[];
  pullRequestUrl: string | null;
  passedCheckCount: number;
  pendingCi?: boolean;
  correctionCommitSha?: string;
  wikiSuggestions?: readonly { sourceId: string; text: string }[];
  urlEvidence?: readonly string[];
};
export interface CorrectionPort {
  fix(
    alert: AlertRecord,
    run: RunRecord,
    appStore: AppStore,
  ): Promise<Result<FixOutcome>>;
  verifyDraft?(
    repo: string,
    commitSha: string,
  ): Promise<Result<"success" | "failure" | "pending">>;
}

export interface ScanFixPort {
  fix(
    run: RunRecord,
    claimIds: readonly string[],
  ): Promise<
    Result<{ pullRequestUrl: string; fixedClaimIds: readonly string[] }>
  >;
}

export interface PublicScanPort {
  scanNow(repo: string): Promise<void>;
}

export interface TrustPort {
  set(
    repo: string,
    claimId: string,
    state: "confirmed" | "dropped",
  ): Promise<Result<{ failing: boolean }>>;
}
