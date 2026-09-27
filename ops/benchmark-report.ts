import type { RunMeasure } from "./benchmark-metrics.ts";
import { verdictAgreement } from "./benchmark-metrics.ts";

export type BenchmarkRow = {
  run: number;
  generationMs: number | null;
  codeSha256: string | null;
  baseline: RunMeasure;
  drift: RunMeasure;
};

function count(
  rows: readonly BenchmarkRow[],
  select: (row: BenchmarkRow) => boolean,
): number {
  return rows.filter(select).length;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] ?? null)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function text(value: number | null): string {
  return value === null ? "not measured" : String(value);
}

function summary(name: string, rows: readonly BenchmarkRow[]): string[] {
  const baseline = rows.map((row) => row.baseline);
  const drift = rows.map((row) => row.drift);
  const runtime = rows.map(
    (row) =>
      (row.generationMs ?? 0) + row.baseline.durationMs + row.drift.durationMs,
  );
  return [
    `### ${name}`,
    "",
    `- Completed runs: ${rows.length}`,
    `- Baseline verdict agreement: ${verdictAgreement(baseline)}`,
    `- Drift verdict agreement: ${verdictAgreement(drift)}`,
    `- False alarms on correct README: ${count(rows, (row) => row.baseline.verdict === "fail")}`,
    `- Drift failures citing a README line: ${count(rows, (row) => row.drift.verdict === "fail" && row.drift.citesDocLine)}`,
    `- Median generation and execution time: ${text(median(runtime))} ms`,
    "",
    "| Run | Generated code SHA-256 | Tests: baseline / drift | Baseline verdict | Drift verdict | README line in drift failure | Generation ms | Baseline ms | Drift ms |",
    "| --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.run} | ${row.codeSha256 ?? "committed"} | ${text(row.baseline.tests)} / ${text(row.drift.tests)} | ${row.baseline.verdict} | ${row.drift.verdict} | ${row.drift.citesDocLine ? "yes" : "no"} | ${text(row.generationMs)} | ${row.baseline.durationMs} | ${row.drift.durationMs} |`,
    ),
    "",
  ];
}

export function benchmarkReport(input: {
  fixture: string;
  fixtureSha256: string;
  model: string;
  generatedAt: string;
  diy: readonly BenchmarkRow[];
  groundControl: readonly BenchmarkRow[];
}): string {
  return [
    "# DIY tests vs Ground Control",
    "",
    `Measured at: ${input.generatedAt}`,
    `Fixture: \`${input.fixture}\``,
    `Frozen fixture SHA-256: \`${input.fixtureSha256}\``,
    `DIY model: \`${input.model}\``,
    "",
    "Each DIY run generated a fresh Node test file from the README and implementation files. Both systems ran against a correct copy and a copy whose server default port changed from 3000 to 8080 while the README stayed unchanged. The generated test code ran only in a disposable, offline, read-only `node:24` container with a 60-second limit; its view of `flightchecks/` was empty so it could not inspect the committed comparison tests. Ground Control used its committed flight checks in the same container profile. Runtime includes Docker startup; DIY totals include model generation.",
    "",
    ...summary("DIY generated tests", input.diy),
    ...summary("Ground Control committed tests", input.groundControl),
    "A `timeout`, `invalid`, or `error` verdict is shown directly and is never counted as a pass. A README line counts only when the drift failure output contains an explicit `README.md:<line>` or `README.md line <line>` reference.",
    "",
  ].join("\n");
}
