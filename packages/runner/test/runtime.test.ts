import { expect, test } from "bun:test";
import {
  memorySnapshot,
  runCliFlag,
  runCommand,
  runServerChecks,
  startProjectProcess,
  withProcess,
} from "../src/index.ts";
import type { ProcessHandle } from "../src/runtime-types.ts";

test("process group cleanup runs when a check throws", async () => {
  let stopped = 0;
  const handle: ProcessHandle = {
    pid: 1234,
    exit: Promise.resolve({ code: null, signal: null }),
    output: () => "",
    stop: async () => {
      stopped += 1;
    },
  };
  await expect(
    withProcess(handle, async () => {
      throw new Error("check failed");
    }),
  ).rejects.toThrow("check failed");
  expect(stopped).toBe(1);
});

if (process.platform !== "win32")
  test("stopping a signal-terminated child resolves", async () => {
    const started = await startProjectProcess(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      process.cwd(),
    );
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    await expect(started.value.stop()).resolves.toBeUndefined();
  });

test("runtime commands reject unsafe first words and shell chaining", async () => {
  const cwd = process.cwd();
  expect((await runCommand("curl example.com", cwd)).status).toBe("unverified");
  expect((await runCommand("npm test && touch bad", cwd)).status).toBe(
    "unverified",
  );
});

test("CLI flag is checked as a source literal without a bin entry", async () => {
  const snapshot = memorySnapshot({
    "package.json": '{"name":"demo"}',
    "src/cli.js": 'const flag = "--format";',
  });
  expect((await runCliFlag("--format", snapshot, process.cwd())).status).toBe(
    "pass",
  );
  expect((await runCliFlag("--missing", snapshot, process.cwd())).status).toBe(
    "fail",
  );
});

test("server checks require a port claim before an HTTP example", async () => {
  const results = await runServerChecks(
    [],
    [
      {
        id: "http",
        method: "GET",
        path: "/",
        expectedStatus: 200,
        expectedKeys: [],
      },
    ],
    process.cwd(),
  );
  expect(results.http?.status).toBe("unverified");
});
