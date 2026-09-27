import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { benchmarkDiy } from "./benchmark-diy.ts";
import { dockerArguments, type ProcessResult } from "./benchmark-docker.ts";
import { measureRun, verdictAgreement } from "./benchmark-metrics.ts";
import { benchmarkReport } from "./benchmark-report.ts";

function result(output: string, exitCode: number): ProcessResult {
  return {
    stdout: output,
    stderr: "",
    exitCode,
    durationMs: 120,
    timedOut: false,
  };
}

test("generated tests receive an offline, read-only, secret-free Docker process", () => {
  const args = dockerArguments(
    resolve("evals", ".benchmark-example"),
    "gc-benchmark-a1b2c3d4e5f6",
    "diy.test.mjs",
  );
  assert.deepEqual(args.slice(0, 5), [
    "run",
    "--pull=never",
    "--rm",
    "--init",
    "--name",
  ]);
  assert.equal(args[args.indexOf("--network") + 1], "none");
  assert.ok(args.includes("--read-only"));
  assert.ok(args.includes("--cap-drop"));
  assert.match(args[args.indexOf("--mount") + 1] ?? "", /,readonly$/);
  assert.match(
    args[args.lastIndexOf("--mount") + 1] ?? "",
    /target=\/work\/flightchecks,readonly$/,
  );
  assert.equal(
    dockerArguments(
      resolve("evals", ".benchmark-example"),
      "gc-benchmark-a1b2c3d4e5f6",
      "flightchecks/flight.test.mjs",
    ).filter((value) => value === "--mount").length,
    1,
  );
  assert.deepEqual(args.slice(args.indexOf("node:24") + 1), [
    "-i",
    "PATH=/usr/local/bin:/usr/bin:/bin",
    "HOME=/tmp",
    "node",
    "--test",
    "--test-reporter=tap",
    "diy.test.mjs",
  ]);
});

test("measurements derive verdicts and README citations from TAP output", () => {
  const passing = measureRun(
    result("# tests 2\n# pass 2\n# fail 0\n# skipped 0\n", 0),
  );
  const failing = measureRun(
    result(
      "not ok 1 - README.md:24 server port\n# tests 2\n# pass 1\n# fail 1\n# skipped 0\n",
      1,
    ),
  );
  assert.equal(passing.verdict, "pass");
  assert.equal(failing.verdict, "fail");
  assert.equal(failing.citesDocLine, true);
  assert.equal(
    verdictAgreement([passing, failing]),
    "1/2 same pass/fail verdict",
  );
  const report = benchmarkReport({
    fixture: "orbit-app",
    fixtureSha256: "abc",
    model: "fixture-model",
    generatedAt: "2026-09-26T00:00:00Z",
    diy: [
      {
        run: 1,
        generationMs: 80,
        codeSha256: "def",
        baseline: passing,
        drift: failing,
      },
    ],
    groundControl: [],
  });
  assert.match(report, /False alarms on correct README: 0/);
  assert.match(report, /Drift failures citing a README line: 1/);
});

test("benchmark stages the same fixture and records only measured fake port results", async () => {
  const outputDir = mkdtempSync(join(tmpdir(), "gc-benchmark-test-"));
  const calls: string[] = [];
  try {
    const resultFile = await benchmarkDiy(resolve("demo/orbit-app"), 1, {
      outputDir,
      model: {
        name: "fake",
        generate: async () => "// generated, never run on host",
      },
      preflight: async () => {},
      run: async (mount, file) => {
        assert.ok(existsSync(join(mount, file)));
        const server = readFileSync(join(mount, "src/server.js"), "utf8");
        const drift = server.includes('process.env.PORT ?? "8080"');
        calls.push(`${file}:${drift ? "drift" : "baseline"}`);
        return result(
          drift
            ? "not ok 1 - README.md:24 port\n# tests 1\n# pass 0\n# fail 1\n# skipped 0\n"
            : "# tests 1\n# pass 1\n# fail 0\n# skipped 0\n",
          drift ? 1 : 0,
        );
      },
    });
    assert.deepEqual(calls, [
      "diy.test.mjs:baseline",
      "diy.test.mjs:drift",
      "flightchecks/flight.test.mjs:baseline",
      "flightchecks/flight.test.mjs:drift",
    ]);
    const report = readFileSync(resultFile.reportPath, "utf8");
    assert.match(report, /Completed runs: 1/);
    assert.match(report, /Drift failures citing a README line: 1/);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
