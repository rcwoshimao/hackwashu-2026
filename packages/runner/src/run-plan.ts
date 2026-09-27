import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { performance } from "node:perf_hooks";
import type { Claim, FlightPlan } from "@ground-control/plan";
import { runCliFlag } from "./cli-flag.ts";
import { runCommand } from "./command.ts";
import { commandHasProvenance } from "./command-provenance.ts";
import type { RuntimeOutcome } from "./runtime-types.ts";
import { type HttpInput, type PortInput, runServerChecks } from "./server.ts";
import { fileSystemSnapshot } from "./snapshot.ts";
import { runStaticCheck } from "./static.ts";
import type { RepositorySnapshot, StaticCheck } from "./types.ts";

const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "flightchecks",
]);

function pathsUnder(root: string, directory = root): string[] {
  const paths: string[] = [];
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (!ignoredDirectories.has(item.name))
        paths.push(...pathsUnder(root, join(directory, item.name)));
    } else if (item.isFile()) {
      paths.push(
        relative(root, join(directory, item.name)).replaceAll("\\", "/"),
      );
    }
  }
  return paths;
}

function staticOutcome(
  claim: StaticCheck,
  snapshot: RepositorySnapshot,
): RuntimeOutcome {
  const startedAt = performance.now();
  const result = runStaticCheck(claim, snapshot);
  if (!result.ok)
    return {
      status: "unverified",
      expected: claim.kind,
      actual: result.error.code,
      durationMs: performance.now() - startedAt,
    };
  return {
    status: result.value.status,
    expected: claim.kind,
    actual: JSON.stringify(result.value),
    durationMs: performance.now() - startedAt,
  };
}

function portInput(claim: Extract<Claim, { kind: "port_listens" }>): PortInput {
  return {
    id: claim.id,
    port: claim.params.port,
    startScript: claim.params.startScript,
    ...(claim.params.timeoutMs === undefined
      ? {}
      : { timeoutMs: claim.params.timeoutMs }),
  };
}

function httpInput(claim: Extract<Claim, { kind: "http_example" }>): HttpInput {
  return {
    id: claim.id,
    method: claim.params.method,
    path: claim.params.path,
    expectedStatus: claim.params.expectedStatus,
    expectedKeys: claim.params.expectedKeys,
  };
}

export async function runPlan(
  plan: FlightPlan,
  cwd = process.cwd(),
): Promise<Record<string, RuntimeOutcome>> {
  const snapshotResult = fileSystemSnapshot(cwd, pathsUnder(cwd));
  if (!snapshotResult.ok)
    throw new Error(
      `Unable to inspect repository: ${snapshotResult.error.code}`,
    );
  const snapshot = snapshotResult.value;
  const results: Record<string, RuntimeOutcome> = {};
  const ports: PortInput[] = [];
  const examples: HttpInput[] = [];
  for (const claim of plan.claims) {
    switch (claim.kind) {
      case "file_exists":
      case "script_exists":
      case "code_reference":
      case "env_var":
      case "version":
        results[claim.id] = staticOutcome(claim, snapshot);
        break;
      case "cli_flag":
        results[claim.id] = await runCliFlag(claim.params.flag, snapshot, cwd);
        break;
      case "command_succeeds":
        results[claim.id] = commandHasProvenance(
          claim,
          claim.params.command,
          snapshot,
        )
          ? await runCommand(claim.params.command, cwd, claim.params.timeoutMs)
          : {
              status: "unverified",
              expected: "Command in a cited code block or package script",
              actual: "Command provenance was not found",
              durationMs: 0,
            };
        break;
      case "port_listens":
        if (
          commandHasProvenance(
            claim,
            `npm run ${claim.params.startScript}`,
            snapshot,
          )
        )
          ports.push(portInput(claim));
        else
          results[claim.id] = {
            status: "unverified",
            expected: "Start command in a cited code block or package script",
            actual: "Command provenance was not found",
            durationMs: 0,
          };
        break;
      case "http_example":
        examples.push(httpInput(claim));
        break;
    }
  }
  Object.assign(results, await runServerChecks(ports, examples, cwd));
  return results;
}
