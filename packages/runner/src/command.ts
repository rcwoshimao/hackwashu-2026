import { performance } from "node:perf_hooks";
import { startProjectProcess, withProcess } from "./process-control.ts";
import { commandTimeoutMs } from "./runtime-limits.ts";
import type { RuntimeOutcome } from "./runtime-types.ts";

const allowed = new Set([
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "node",
  "npx",
  "cp",
  "mkdir",
  "touch",
]);

function tokens(command: string): string[] | null {
  if (/[;&|<>`$()\r\n]/u.test(command) || command !== command.trim())
    return null;
  const parts =
    command.match(/"[^"]*"|'[^']*'|\S+/gu)?.map((part) => {
      if (
        (part.startsWith('"') && part.endsWith('"')) ||
        (part.startsWith("'") && part.endsWith("'"))
      )
        return part.slice(1, -1);
      return part;
    }) ?? [];
  return parts.length > 0 && allowed.has(parts[0] ?? "") ? parts : null;
}

function outputText(output: string): string {
  return output.split(/\r?\n/u).slice(0, 20).join("\n").trim();
}

async function waitForExit(
  handle: { exit: Promise<{ code: number | null }> },
  timeoutMs: number,
): Promise<{ code: number | null } | "timeout"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      handle.exit,
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function commandOnce(
  command: string,
  cwd: string,
  timeoutMs: number,
): Promise<RuntimeOutcome> {
  const start = performance.now();
  const args = tokens(command);
  if (!args)
    return {
      status: "unverified",
      expected: "Allowed command",
      actual: "Command was not safe to run",
      durationMs: 0,
    };
  const [executable, ...rest] = args;
  if (!executable)
    return {
      status: "unverified",
      expected: "Allowed command",
      actual: "Command was empty",
      durationMs: 0,
    };
  const started = await startProjectProcess(executable, rest, cwd);
  if (!started.ok)
    return {
      status: "fail",
      expected: "Exit code 0",
      actual: started.error.message,
      durationMs: performance.now() - start,
    };
  return withProcess(started.value, async (handle) => {
    const exit = await waitForExit(handle, timeoutMs);
    const status = exit === "timeout" || exit.code !== 0 ? "fail" : "pass";
    const actual =
      exit === "timeout"
        ? `Timed out after ${timeoutMs} ms`
        : `Exit ${exit.code}: ${outputText(handle.output())}`;
    return {
      status,
      expected: "Exit code 0",
      actual,
      durationMs: performance.now() - start,
    };
  });
}

export async function runCommand(
  command: string,
  cwd: string,
  timeoutMs = commandTimeoutMs,
): Promise<RuntimeOutcome> {
  const first = await commandOnce(command, cwd, timeoutMs);
  if (first.status !== "fail") return first;
  const second = await commandOnce(command, cwd, timeoutMs);
  if (second.status === "pass")
    return {
      ...second,
      status: "flaky",
      actual: `Passed after a clean retry. First: ${first.actual}`,
    };
  return { ...second, actual: `${first.actual}\nRetry: ${second.actual}` };
}
