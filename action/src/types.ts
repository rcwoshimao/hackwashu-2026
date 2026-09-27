import type { FlightPlan } from "../../packages/plan/src/schema.ts";
import type { RuntimeOutcome } from "../../packages/runner/src/runtime-types.ts";

export type FlightRunner = (
  plan: FlightPlan,
  cwd: string,
) => Promise<Record<string, RuntimeOutcome>>;

export type ChangeMetadata = {
  authorLogin?: string;
  changedFiles?: string[];
  codeChanged?: boolean;
  docsChanged?: boolean;
  pullRequestNumber?: number;
};

export type TelemetryResult = {
  kind: FlightPlan["claims"][number]["kind"];
  params: FlightPlan["claims"][number]["params"];
  claimId: string;
  sourceId: string;
  quote: string;
  status: RuntimeOutcome["status"];
  expected: string;
  actual: string;
  deepLink?: string | null;
};

export type Telemetry = {
  repo: string;
  commitSha: string;
  results: TelemetryResult[];
} & ChangeMetadata;
