export type RuntimeStatus =
  | "pass"
  | "fail"
  | "flaky"
  | "skipped"
  | "unverified";

export type RuntimeOutcome = {
  status: RuntimeStatus;
  expected: string;
  actual: string;
  durationMs: number;
};

export type ProcessExit = {
  code: number | null;
  signal: NodeJS.Signals | null;
};

export interface ProcessHandle {
  pid: number;
  exit: Promise<ProcessExit>;
  output(): string;
  stop(): Promise<void>;
}

export type ProcessError = {
  code: "spawn_failed";
  command: string;
  message: string;
};

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
