import { createConnection } from "node:net";
import { performance } from "node:perf_hooks";
import { startProjectProcess, withProcess } from "./process-control.ts";
import {
  cleanupPollIntervalMs,
  cleanupTimeoutMs,
  portPollIntervalMs,
  startTimeoutMs,
} from "./runtime-limits.ts";
import type { ProcessHandle, RuntimeOutcome } from "./runtime-types.ts";

export type PortInput = {
  id: string;
  port: number;
  startScript: string;
  timeoutMs?: number;
};
export type HttpInput = {
  id: string;
  method: string;
  path: string;
  expectedStatus: number;
  expectedKeys: readonly string[];
};

function trimOutput(output: string): string {
  return output.split(/\r?\n/u).slice(0, 20).join("\n").trim();
}

function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(portPollIntervalMs);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function rootResponds(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if ((await canConnect(port)) && (await rootResponds(port))) return true;
    await new Promise((resolve) => setTimeout(resolve, portPollIntervalMs));
  }
  return false;
}

async function waitForPortRelease(port: number): Promise<boolean> {
  const deadline = performance.now() + cleanupTimeoutMs;
  while (performance.now() < deadline) {
    if (!(await canConnect(port))) return true;
    await new Promise((resolve) => setTimeout(resolve, cleanupPollIntervalMs));
  }
  return false;
}

async function checkPort(
  input: PortInput,
  handle: ProcessHandle,
): Promise<RuntimeOutcome> {
  const startedAt = performance.now();
  const passed = await waitForPort(
    input.port,
    input.timeoutMs ?? startTimeoutMs,
  );
  return {
    status: passed ? "pass" : "fail",
    expected: `TCP and GET / on port ${input.port} with status below 500`,
    actual: passed
      ? `Port ${input.port} responded`
      : `No healthy response on port ${input.port}; ${trimOutput(handle.output())}`,
    durationMs: performance.now() - startedAt,
  };
}

async function checkHttp(
  input: HttpInput,
  port: number,
): Promise<RuntimeOutcome> {
  const startedAt = performance.now();
  const expected = `${input.method} ${input.path}: status ${input.expectedStatus} and JSON keys ${input.expectedKeys.join(", ")}`;
  try {
    const response = await fetch(`http://127.0.0.1:${port}${input.path}`, {
      method: input.method,
      signal: AbortSignal.timeout(3000),
    });
    const body: unknown = await response.json();
    const keys =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? Object.keys(body)
        : [];
    const passed =
      response.status === input.expectedStatus &&
      input.expectedKeys.every((key) => keys.includes(key));
    return {
      status: passed ? "pass" : "fail",
      expected,
      actual: `Status ${response.status}; keys ${keys.join(", ")}`,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "fail",
      expected,
      actual: error instanceof Error ? error.message : "Request failed",
      durationMs: performance.now() - startedAt,
    };
  }
}

async function serverSession(
  ports: readonly PortInput[],
  examples: readonly HttpInput[],
  cwd: string,
): Promise<Record<string, RuntimeOutcome>> {
  const results: Record<string, RuntimeOutcome> = {};
  const script = ports[0]?.startScript;
  if (
    !script ||
    !/^[A-Za-z0-9:_-]+$/u.test(script) ||
    ports.some((item) => item.startScript !== script)
  ) {
    for (const item of [...ports, ...examples])
      results[item.id] = {
        status: "unverified",
        expected: "Safe start script",
        actual: "No safe start script",
        durationMs: 0,
      };
    return results;
  }
  const occupied: number[] = [];
  for (const item of ports)
    if (await canConnect(item.port)) occupied.push(item.port);
  if (occupied.length > 0) {
    for (const item of ports)
      results[item.id] = {
        status: "unverified",
        expected: `Port ${item.port} free before start`,
        actual: `Port ${occupied.join(", ")} occupied before the project started`,
        durationMs: 0,
      };
    for (const item of examples)
      results[item.id] = {
        status: "skipped",
        expected: "Project server is running",
        actual: "Port belongs to another process",
        durationMs: 0,
      };
    return results;
  }
  const started = await startProjectProcess("npm", ["run", script], cwd, true);
  if (!started.ok) {
    for (const item of ports)
      results[item.id] = {
        status: "fail",
        expected: `npm run ${script}`,
        actual: started.error.message,
        durationMs: 0,
      };
    for (const item of examples)
      results[item.id] = {
        status: "skipped",
        expected: "Server is running",
        actual: "Start failed",
        durationMs: 0,
      };
    return results;
  }
  const outcomes = await withProcess(started.value, async (handle) => {
    for (const item of ports) results[item.id] = await checkPort(item, handle);
    const mainPort = ports[0];
    const ready = mainPort && results[mainPort.id]?.status === "pass";
    for (const item of examples)
      results[item.id] =
        ready && mainPort
          ? await checkHttp(item, mainPort.port)
          : {
              status: "skipped",
              expected: "Server is running",
              actual: "Port check failed",
              durationMs: 0,
            };
    return results;
  });
  if (ports[0] && !(await waitForPortRelease(ports[0].port)))
    throw new Error(`Server did not release port ${ports[0].port}`);
  return outcomes;
}

export async function runServerChecks(
  ports: readonly PortInput[],
  examples: readonly HttpInput[],
  cwd: string,
): Promise<Record<string, RuntimeOutcome>> {
  if (ports.length === 0 && examples.length === 0) return {};
  const first = await serverSession(ports, examples, cwd);
  if (!Object.values(first).some((result) => result.status === "fail"))
    return first;
  const second = await serverSession(ports, examples, cwd);
  const merged: Record<string, RuntimeOutcome> = {};
  for (const item of [...ports, ...examples]) {
    const before = first[item.id];
    const after = second[item.id];
    if (!after) continue;
    merged[item.id] =
      before?.status === "fail" && after.status === "pass"
        ? {
            ...after,
            status: "flaky",
            actual: `Passed after restart. First: ${before.actual}`,
          }
        : after;
  }
  return merged;
}
