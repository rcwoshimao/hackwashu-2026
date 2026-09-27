import type { ProcessResult } from "./benchmark-docker.ts";

export type Verdict = "pass" | "fail" | "invalid" | "timeout" | "error";
export type RunMeasure = {
  tests: number | null;
  passed: number | null;
  failed: number | null;
  skipped: number | null;
  verdict: Verdict;
  citesDocLine: boolean;
  durationMs: number;
};

function footer(output: string, name: string): number | null {
  const matches = [...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))];
  const last = matches.at(-1)?.[1];
  return last === undefined ? null : Number(last);
}

export function measureRun(result: ProcessResult): RunMeasure {
  const output = `${result.stdout}\n${result.stderr}`;
  const tests = footer(output, "tests");
  const passed = footer(output, "pass");
  const failed = footer(output, "fail");
  const skipped = footer(output, "skipped");
  const verdict: Verdict = result.timedOut
    ? "timeout"
    : tests === null || tests === 0
      ? "invalid"
      : result.exitCode === 0 && failed === 0
        ? "pass"
        : (failed ?? 0) > 0
          ? "fail"
          : "error";
  return {
    tests,
    passed,
    failed,
    skipped,
    verdict,
    citesDocLine:
      verdict === "fail" && /README\.md(?::|\s+line\s+)\d+/i.test(output),
    durationMs: result.durationMs,
  };
}

export function verdictAgreement(measures: readonly RunMeasure[]): string {
  if (measures.length === 0) return "not measured";
  const verdicts = measures.map((measure) => measure.verdict);
  const pass = verdicts.filter((value) => value === "pass").length;
  const fail = verdicts.filter((value) => value === "fail").length;
  return `${Math.max(pass, fail)}/${measures.length} same pass/fail verdict`;
}
