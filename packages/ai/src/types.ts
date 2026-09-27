import type { Check } from "@ground-control/plan";

export type ProposedCheck = Check & { quote: string };
export type ModelInput = {
  sectionText: string;
  candidates: readonly { signal: string; quote: string }[];
};
export type ModelError = {
  code: "unavailable" | "timeout" | "invalid_response";
};
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: ModelError };

export interface ModelPort {
  readonly model: string;
  extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>>;
}

export interface ModelCache {
  get(key: string): readonly ProposedCheck[] | null;
  set(key: string, value: readonly ProposedCheck[]): void;
}

export class MemoryModelCache implements ModelCache {
  private readonly values = new Map<string, readonly ProposedCheck[]>();
  get(key: string): readonly ProposedCheck[] | null {
    return this.values.get(key) ?? null;
  }
  set(key: string, value: readonly ProposedCheck[]): void {
    this.values.set(key, value);
  }
}
