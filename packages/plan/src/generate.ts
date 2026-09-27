import { canonicalJson } from "./identity";
import type { FlightPlan } from "./schema";

function locationLabel(plan: FlightPlan, claimIndex: number): string {
  const claim = plan.claims[claimIndex];
  if (!claim) throw new RangeError("Claim index is outside the flight plan");
  const first = claim.occurrences[0];
  if (!first) throw new TypeError("A claim must have an occurrence");
  const location = first.location;
  if (location.kind === "file") return `${location.path}:${location.lineStart}`;
  if (location.kind === "confluence") return `Confluence ${location.pageId}`;
  if (location.kind === "wiki") return `Wiki ${location.page}`;
  return location.url;
}

export function planToTests(plan: FlightPlan): string {
  const lines = [
    'import assert from "node:assert/strict";',
    'import { test } from "node:test";',
    'import { runPlan } from "./runner.mjs";',
    "",
    `const plan = ${canonicalJson(plan)};`,
    "const results = await runPlan(plan);",
    "const byIndex = plan.claims.map((claim) => results[claim.id]);",
    "",
  ];
  for (const [index, claim] of plan.claims.entries()) {
    const first = claim.occurrences[0];
    if (!first) throw new TypeError("A claim must have an occurrence");
    const label = `${locationLabel(plan, index)}  ${first.quote}`;
    lines.push(
      `test(${JSON.stringify(label)}, { skip: byIndex[${index}]?.status === "unverified" || byIndex[${index}]?.status === "skipped" }, () => {`,
    );
    lines.push(`  const result = byIndex[${index}];`);
    lines.push('  assert.ok(result, "Runner returned no result");');
    lines.push(
      '  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\\n"));',
    );
    lines.push("});");
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
