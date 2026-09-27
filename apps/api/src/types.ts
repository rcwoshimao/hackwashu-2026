import type { AuthService } from "@ground-control/auth";
import type { PrCommentPort } from "@ground-control/fixes";
import type { MessagingHub } from "@ground-control/messaging";
import type { SourceSync } from "@ground-control/source-sync";
import type { AppStore, EventRecord, RunRecord } from "@ground-control/store";
import type { ScanFixService } from "./scan-fix.ts";

export type ScanResult =
  | { state: "queued"; repo: string; requestId?: string }
  | { state: "cached"; repo: string; commitSha: string };

export interface PublicScanPort {
  scan(repo: string): Promise<ScanResult>;
}

export interface CommitStatusPort {
  post(run: RunRecord): Promise<boolean>;
}

export type CommitAuthorResult =
  | { ok: true; login: string | null }
  | { ok: false; error: "github_unavailable" };

export interface CommitAuthorPort {
  lookup(repo: string, commitSha: string): Promise<CommitAuthorResult>;
}

export type SmokePrResult =
  | { ok: true; url: string }
  | { ok: false; reason: "setup_incomplete" | "github_unavailable" };

export interface SmokePrPort {
  create(repo: string): Promise<SmokePrResult>;
}

export type WorkflowInstallResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: "setup_incomplete" | "github_unavailable" };

export interface WorkflowInstallPort {
  install(
    repo: string,
    branch: string,
    serverUrl: string,
  ): Promise<WorkflowInstallResult>;
}

export type DeepFixResult =
  | { ok: true; url: string; fixedClaimIds: readonly string[] }
  | { ok: false; reason: "no_fix" | "unavailable" };

export interface DeepFixPort {
  fix(
    run: RunRecord,
    claimIds: readonly string[],
    oauthToken: string,
  ): Promise<DeepFixResult>;
}

export interface ApiDeps {
  store: AppStore;
  auth: AuthService;
  scanner?: PublicScanPort;
  status?: CommitStatusPort;
  commitAuthor?: CommitAuthorPort;
  smokePr?: SmokePrPort;
  workflowInstall?: WorkflowInstallPort;
  deepFix?: DeepFixPort;
  prComments?: PrCommentPort;
  messaging?: Pick<MessagingHub, "alert"> &
    Partial<
      Pick<
        MessagingHub,
        "requestLink" | "confirmCorrection" | "scanAlert" | "restoreClaim"
      >
    >;
  scanFix?: ScanFixService;
  sourceSync?: Pick<SourceSync, "status" | "refresh" | "discover">;
  confluenceSite?: string | undefined;
  events: EventHub;
  now: () => Date;
  publicUrl: string;
  webDist?: string;
  clientIp?: (request: Request) => string;
  schedulePlan?: (repo: string) => void;
}

export class EventHub {
  private readonly listeners = new Set<(event: EventRecord) => void>();

  subscribe(listener: (event: EventRecord) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: EventRecord): void {
    for (const listener of this.listeners) listener(event);
  }
}
