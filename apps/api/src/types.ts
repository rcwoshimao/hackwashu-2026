import type { AuthService } from "@ground-control/auth";
import type { PrCommentPort } from "@ground-control/fixes";
import type { MessagingHub } from "@ground-control/messaging";
import type { SourceSync } from "@ground-control/source-sync";
import type { AppStore, EventRecord, RunRecord } from "@ground-control/store";
import type { ScanFixService } from "./scan-fix.ts";

export type ScanResult =
  | { state: "queued"; repo: string }
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

export interface ApiDeps {
  store: AppStore;
  auth: AuthService;
  scanner?: PublicScanPort;
  status?: CommitStatusPort;
  commitAuthor?: CommitAuthorPort;
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
