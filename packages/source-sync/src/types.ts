import type { DocText } from "@ground-control/sources";

export type SyncErrorCode =
  | "not_found"
  | "invalid_source"
  | "unsafe_url"
  | "credential_required"
  | "unconfigured"
  | "too_large"
  | "timeout"
  | "http_error"
  | "invalid_body";
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: SyncErrorCode } };

export interface RepositoryFilePort {
  inventory(
    repo: string,
    token?: string,
  ): Promise<Result<{ sha: string; paths: readonly string[] }>>;
  readFile(
    repo: string,
    path: string,
    token?: string,
  ): Promise<Result<{ text: string; version: string }>>;
}

export type FetchedDoc = { doc: DocText; version: string | null };
export type SyncStatus = {
  status: "pending" | "fresh" | "error";
  contentHash: string | null;
  version: string | null;
  fetchedAt: string | null;
  errorCode: SyncErrorCode | null;
};
