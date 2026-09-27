import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { actionMetadata } from "../../../action/src/git-context.ts";
import {
  type ReportResult,
  reportTelemetry,
} from "../../../action/src/report.ts";
import { loadRunner, runFlightChecks } from "../../../action/src/run.ts";
import type { FlightRunner, Telemetry } from "../../../action/src/types.ts";
import {
  type GitResult,
  LocalGit,
} from "../../../packages/local-git/src/index.ts";
import { copyOrbitFixture, isolateOrbitPort } from "./orbit-fixture.ts";

export type SimulationOptions = {
  server?: string;
  token?: string;
  transport?: typeof fetch;
};
export type SimulationResult =
  | {
      ok: true;
      baseline: Telemetry;
      drift?: Telemetry;
      temporaryPort: number;
      baselinePort: number;
      driftPort?: number;
      baselineReport: ReportResult;
      driftReport?: ReportResult;
      changedFiles?: string[];
    }
  | {
      ok: false;
      error: {
        code:
          | "fixture_failed"
          | "git_failed"
          | "runner_failed"
          | "report_failed"
          | "cleanup_failed";
        message: string;
      };
    };

class SimulationFailure extends Error {
  constructor(
    readonly code:
      | "fixture_failed"
      | "git_failed"
      | "runner_failed"
      | "report_failed",
    message: string,
  ) {
    super(message);
  }
}

function gitValue<T>(result: GitResult<T>): T {
  if (!result.ok)
    throw new SimulationFailure(
      "git_failed",
      `${result.error.operation}: ${result.error.code}`,
    );
  return result.value;
}

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new SimulationFailure("fixture_failed", "No TCP port was assigned");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

async function adaptedPatch(
  root: string,
  path: string,
  port: number,
): Promise<{ path: string; driftPort?: number }> {
  let patch = readFileSync(resolve(path), "utf8").replaceAll(
    "3000",
    String(port),
  );
  let driftPort: number | undefined;
  const changedDefault =
    /^\+const port = Number\(process\.env\.PORT \?\? "\d+"\);$/mu;
  if (changedDefault.test(patch)) {
    driftPort = await freePort();
    while (driftPort === port || [3000, 8080, 9090].includes(driftPort))
      driftPort = await freePort();
    patch = patch.replace(
      changedDefault,
      `+const port = Number(process.env.PORT ?? "${driftPort}");`,
    );
  }
  const target = join(root, ".groundcontrol", "local-drift.patch");
  writeFileSync(target, patch);
  return { path: target, ...(driftPort === undefined ? {} : { driftPort }) };
}

async function report(
  root: string,
  options: SimulationOptions,
  telemetry: Telemetry,
): Promise<ReportResult> {
  const result = await reportTelemetry(
    root,
    options.server ?? "",
    options.token ?? "",
    { repo: telemetry.repo, commitSha: telemetry.commitSha },
    options.transport ?? fetch,
  );
  if (!result.ok) throw new SimulationFailure("report_failed", result.error);
  return result;
}

type BaselineContext = {
  repo: string;
  git: LocalGit;
  sha: string;
  runner: FlightRunner;
  telemetry: Telemetry;
  reportResult: ReportResult;
};

async function baselineRun(
  root: string,
  port: number,
  options: SimulationOptions,
): Promise<BaselineContext> {
  const plan = isolateOrbitPort(root, port);
  const git = new LocalGit(root);
  gitValue(git.init());
  const sha = gitValue(git.commitAll("Simulated Orbit baseline"));
  const runner = await loadRunner(root);
  const telemetry = await runFlightChecks(root, plan.repo, sha, runner, {
    changedFiles: [],
    codeChanged: false,
    docsChanged: false,
    authorLogin: "local-simulator",
  });
  const reportResult = await report(root, options, telemetry);
  return { repo: plan.repo, git, sha, runner, telemetry, reportResult };
}

async function driftRun(
  root: string,
  patchPath: string,
  port: number,
  base: BaselineContext,
  options: SimulationOptions,
) {
  const patch = await adaptedPatch(root, patchPath, port);
  gitValue(base.git.applyPatch(patch.path));
  const headSha = gitValue(base.git.commitAll("Simulated Orbit drift"));
  const changedFiles = gitValue(base.git.changedFiles(base.sha, headSha));
  const metadata = actionMetadata(root, {
    before: base.sha,
    after: headSha,
    head_commit: { author: { username: "local-simulator" } },
  });
  const telemetry = await runFlightChecks(
    root,
    base.repo,
    headSha,
    base.runner,
    metadata,
  );
  const reportResult = await report(root, options, telemetry);
  return { telemetry, reportResult, changedFiles, driftPort: patch.driftPort };
}

async function runStaged(
  root: string,
  patchPath: string | undefined,
  port: number,
  options: SimulationOptions,
): Promise<SimulationResult> {
  const base = await baselineRun(root, port, options);
  if (!patchPath)
    return {
      ok: true,
      baseline: base.telemetry,
      temporaryPort: port,
      baselinePort: port,
      baselineReport: base.reportResult,
    };
  const drift = await driftRun(root, patchPath, port, base, options);
  return {
    ok: true,
    baseline: base.telemetry,
    drift: drift.telemetry,
    temporaryPort: port,
    baselinePort: port,
    ...(drift.driftPort === undefined ? {} : { driftPort: drift.driftPort }),
    baselineReport: base.reportResult,
    driftReport: drift.reportResult,
    changedFiles: drift.changedFiles,
  };
}

function cleanupStaged(staged: string): boolean {
  try {
    const temporaryRoot = realpathSync(tmpdir());
    if (!realpathSync(staged).startsWith(`${temporaryRoot}${sep}`))
      return false;
    rmSync(staged, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
    return true;
  } catch {
    return false;
  }
}

export async function simulateCi(
  path: string,
  patchPath?: string,
  options: SimulationOptions = {},
): Promise<SimulationResult> {
  let staged: string | undefined;
  let outcome: SimulationResult;
  try {
    const source = realpathSync(path);
    staged = mkdtempSync(join(tmpdir(), "groundcontrol-simulate-ci-"));
    if (!realpathSync(staged).startsWith(`${realpathSync(tmpdir())}${sep}`))
      throw new SimulationFailure(
        "fixture_failed",
        "Temporary checkout left system temp directory",
      );
    copyOrbitFixture(source, staged);
    let port = await freePort();
    while ([3000, 8080, 9090].includes(port)) port = await freePort();
    outcome = await runStaged(staged, patchPath, port, options);
  } catch (error) {
    const failure =
      error instanceof SimulationFailure
        ? error
        : new SimulationFailure(
            "runner_failed",
            error instanceof Error ? error.message : "Simulation failed",
          );
    outcome = {
      ok: false,
      error: { code: failure.code, message: failure.message },
    };
  }
  if (staged && !cleanupStaged(staged))
    return {
      ok: false,
      error: {
        code: "cleanup_failed",
        message: "Temporary checkout could not be removed",
      },
    };
  return outcome;
}
