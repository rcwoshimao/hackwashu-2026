import { readFile, stat } from "node:fs/promises";
import { simulateCi } from "./apps/cli/src/index.ts";
import { maxCandidateFileBytes } from "./config/limits.ts";
import { benchmarkDiy } from "./ops/benchmark-diy.ts";
import { extractFile, pingGitHub, pingModels } from "./ops/diagnostics.ts";
import { publishSavedPlan } from "./ops/publish-plan.ts";
import { seedPlan } from "./ops/seed-plan.ts";
import { skyCommand } from "./ops/sky.ts";
import { extractCandidates } from "./packages/claims/src/index.ts";
import { copy } from "./packages/copy/src/index.ts";

type ReadResult =
  | { ok: true; markdown: string }
  | { ok: false; reason: "unreadable" | "tooLarge" };

async function readMarkdown(path: string): Promise<ReadResult> {
  try {
    const details = await stat(path);
    if (!details.isFile()) return { ok: false, reason: "unreadable" };
    if (details.size > maxCandidateFileBytes) {
      return { ok: false, reason: "tooLarge" };
    }
    return { ok: true, markdown: await readFile(path, "utf8") };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

async function main(): Promise<void> {
  const [command, path, ...rest] = process.argv.slice(2);
  if (command === "benchmark-diy") {
    try {
      if (
        !path ||
        (rest.length > 0 && (rest.length !== 2 || rest[0] !== "--runs"))
      )
        throw new Error("usage: benchmark-diy <checkout> [--runs 10]");
      const runs = rest.length === 2 ? Number(rest[1]) : 10;
      process.stdout.write(
        `${JSON.stringify(await benchmarkDiy(path, runs), null, 2)}\n`,
      );
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : "benchmark_failed"}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }
  if (command === "ping-github" || command === "ping-models") {
    try {
      const result =
        command === "ping-github" ? await pingGitHub() : await pingModels();
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : "diagnostic_failed"}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }
  if (command === "seed-plan") {
    try {
      if (!path || !rest[0])
        throw new Error("usage: seed-plan <checkout> <owner/repo>");
      process.stdout.write(
        `${JSON.stringify(await seedPlan(path, rest[0]), null, 2)}\n`,
      );
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : "seed_failed"}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }
  if (command === "publish-plan") {
    try {
      if (!path) throw new Error("usage: publish-plan <owner/repo>");
      process.stdout.write(
        `${JSON.stringify(await publishSavedPlan(path), null, 2)}\n`,
      );
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : "publish_failed"}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }
  if (command === "fly" || command === "simulate-ci") {
    const demoPath = path && path !== "orbit-app" ? path : "demo/orbit-app";
    const patch = rest[0] ?? "demo/orbit-app/drifts/port-8080.patch";
    const result = await simulateCi(demoPath, patch);
    if (result.ok) {
      const count = (status: string, results: readonly { status: string }[]) =>
        results.filter((item) => item.status === status).length;
      process.stdout.write(
        `${JSON.stringify(
          {
            ok: true,
            baselinePort: result.baselinePort,
            driftPort: result.driftPort ?? null,
            baseline: {
              passed: count("pass", result.baseline.results),
              failed: count("fail", result.baseline.results),
              skipped: count("skipped", result.baseline.results),
            },
            drift: result.drift
              ? {
                  passed: count("pass", result.drift.results),
                  failed: result.drift.results
                    .filter((item) => item.status === "fail")
                    .map((item) => ({
                      claimId: item.claimId,
                      quote: item.quote,
                      expected: item.expected,
                      actual: item.actual,
                    })),
                  skipped: count("skipped", result.drift.results),
                  changedFiles: result.changedFiles,
                }
              : null,
          },
          null,
          2,
        )}\n`,
      );
    } else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command?.startsWith("sky:")) {
    try {
      const result = await skyCommand(
        command,
        [path, ...rest].filter((item): item is string => item !== undefined),
      );
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      const code = error instanceof Error ? error.message : "sky_error";
      process.stderr.write(`${code}\n`);
      process.exitCode = 1;
    }
    return;
  }
  if (command !== "candidates" && command !== "extract") {
    process.stderr.write(`${copy.opsUnsupported}\n${copy.opsUsage}\n`);
    process.exitCode = 1;
    return;
  }
  if (!path) {
    process.stderr.write(`${copy.opsFileRequired}\n${copy.opsUsage}\n`);
    process.exitCode = 1;
    return;
  }
  const result = await readMarkdown(path);
  if (!result.ok) {
    const message =
      result.reason === "tooLarge"
        ? copy.opsFileTooLarge
        : copy.opsFileUnreadable;
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
    return;
  }
  if (command === "extract") {
    try {
      const extracted = await extractFile(path, result.markdown);
      process.stdout.write(`${JSON.stringify(extracted, null, 2)}\n`);
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : "extract_failed"}\n`,
      );
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(
      `${JSON.stringify(extractCandidates(result.markdown), null, 2)}\n`,
    );
  }
}

await main();
