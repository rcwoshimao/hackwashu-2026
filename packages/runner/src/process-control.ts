import { type ChildProcessByStdio, spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { outputLimitBytes, stopGraceMs } from "./runtime-limits.ts";
import type {
  ProcessError,
  ProcessExit,
  ProcessHandle,
  Result,
} from "./runtime-types.ts";

function runEnvironment(withoutPort: boolean): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (withoutPort) delete env.PORT;
  return env;
}

async function terminateGroup(pid: number): Promise<boolean> {
  if (process.platform === "win32") {
    return new Promise((resolve) => {
      const killer = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("exit", (code) => resolve(code === 0));
      killer.once("error", () => resolve(false));
    });
  }
  try {
    process.kill(-pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

function forceGroup(pid: number): void {
  if (process.platform === "win32") return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    return;
  }
}

export async function withProcess<T>(
  handle: ProcessHandle,
  action: (handle: ProcessHandle) => Promise<T>,
): Promise<T> {
  try {
    return await action(handle);
  } finally {
    await handle.stop();
  }
}

export async function startProjectProcess(
  command: string,
  args: readonly string[],
  cwd: string,
  withoutPort = false,
): Promise<Result<ProcessHandle, ProcessError>> {
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  let child: ChildProcessByStdio<null, Readable, Readable>;
  try {
    child = spawn(executable, [...args], {
      cwd,
      env: runEnvironment(withoutPort),
      detached: process.platform !== "win32",
      shell: process.platform === "win32" && command === "npm",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "spawn_failed",
        command,
        message:
          error instanceof Error ? error.message : "Process could not start",
      },
    };
  }
  let exited = false;
  const exit = new Promise<ProcessExit>((resolve) =>
    child.once("exit", (code, signal) => {
      exited = true;
      resolve({ code, signal });
    }),
  );
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk: Buffer) => {
      if (output.length < outputLimitBytes)
        output += chunk
          .toString("utf8")
          .slice(0, outputLimitBytes - output.length);
    });
  }
  const started = await new Promise<Result<void, ProcessError>>((resolve) => {
    child.once("spawn", () => resolve({ ok: true, value: undefined }));
    child.once("error", (error) =>
      resolve({
        ok: false,
        error: { code: "spawn_failed", command, message: error.message },
      }),
    );
  });
  if (!started.ok) return started;
  const handle: ProcessHandle = {
    pid: child.pid ?? 0,
    exit,
    output: () => output,
    stop: async () => {
      if (child.pid === undefined) return;
      const terminated = await terminateGroup(child.pid);
      if (!terminated && !exited) child.kill();
      await Promise.race([
        exit,
        new Promise((resolve) => setTimeout(resolve, stopGraceMs)),
      ]);
      if (!exited) forceGroup(child.pid);
      await Promise.race([
        exit,
        new Promise((resolve) => setTimeout(resolve, stopGraceMs)),
      ]);
      if (!exited) throw new Error(`Process ${child.pid} did not terminate`);
    },
  };
  return { ok: true, value: handle };
}
