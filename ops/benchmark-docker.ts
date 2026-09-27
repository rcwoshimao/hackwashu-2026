import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { isAbsolute, join } from "node:path";

const dockerTimeoutMs = 60_000;
const cleanupTimeoutMs = 5_000;
const maxOutputChars = 65_536;
const isolationArgs = [
  "--network",
  "none",
  "--read-only",
  "--user",
  "65534:65534",
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--pids-limit",
  "64",
  "--memory",
  "512m",
  "--cpus",
  "1",
  "--tmpfs",
  "/tmp:rw,nosuid,nodev,size=64m,mode=1777",
] as const;
const nodeTestArgs = [
  "--workdir",
  "/work",
  "--entrypoint",
  "/usr/bin/env",
  "node:24",
  "-i",
  "PATH=/usr/local/bin:/usr/bin:/bin",
  "HOME=/tmp",
  "node",
  "--test",
  "--test-reporter=tap",
] as const;
export type BenchmarkTestFile = "diy.test.mjs" | "flightchecks/flight.test.mjs";
export type ProcessResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
};

export function dockerArguments(
  mount: string,
  name: string,
  testFile: BenchmarkTestFile,
): string[] {
  if (!isAbsolute(mount) || /[,\r\n]/.test(mount))
    throw new Error("benchmark_mount_invalid");
  if (!/^gc-benchmark-[a-f0-9]{12}$/.test(name))
    throw new Error("benchmark_name_invalid");
  return [
    "run",
    "--pull=never",
    "--rm",
    "--init",
    "--name",
    name,
    ...isolationArgs,
    "--mount",
    `type=bind,source=${mount},target=/work,readonly`,
    ...(testFile === "diy.test.mjs"
      ? [
          "--mount",
          `type=bind,source=${join(mount, ".benchmark-empty-flightchecks")},target=/work/flightchecks,readonly`,
        ]
      : []),
    ...nodeTestArgs,
    testFile,
  ];
}

function processOutput(
  args: readonly string[],
  timeoutMs: number,
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn("docker", [...args], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let finished = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = (stdout + chunk.toString()).slice(0, maxOutputChars);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(0, maxOutputChars);
    });
    const finish = (exitCode: number | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        exitCode,
        stdout,
        stderr,
        timedOut,
        durationMs: Math.round(performance.now() - started),
      });
    };
    child.on("error", () => finish(null));
    child.on("close", finish);
  });
}

export async function dockerPreflight(): Promise<void> {
  const engine = await processOutput(
    ["version", "--format", "{{.Server.Version}}"],
    10_000,
  );
  if (engine.exitCode !== 0 || engine.timedOut)
    throw new Error("docker_unavailable");
  const image = await processOutput(["image", "inspect", "node:24"], 10_000);
  if (image.exitCode !== 0 || image.timedOut)
    throw new Error("node24_image_missing: run docker pull node:24");
}

export async function runDockerTest(
  mount: string,
  testFile: BenchmarkTestFile,
): Promise<ProcessResult> {
  const name = `gc-benchmark-${randomBytes(6).toString("hex")}`;
  const result = await processOutput(
    dockerArguments(mount, name, testFile),
    dockerTimeoutMs,
  );
  const cleanup = await processOutput(
    ["rm", "--force", name],
    cleanupTimeoutMs,
  );
  if (
    cleanup.timedOut ||
    (cleanup.exitCode !== 0 && !/No such container/i.test(cleanup.stderr))
  )
    throw new Error("docker_cleanup_failed");
  return result;
}
