import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  claimId,
  flightPlanSchema,
  planToTests,
} from "../../../packages/plan/src/index.ts";
import type { FlightPlan } from "../../../packages/plan/src/schema.ts";

const copiedPaths = [
  "README.md",
  "package.json",
  "package-lock.json",
  ".env.example",
  ".gitignore",
  "src",
  "bin",
  "test",
  "man",
  "flightchecks",
];

export function copyOrbitFixture(source: string, target: string): void {
  for (const path of copiedPaths) {
    const origin = join(source, path);
    if (!existsSync(origin))
      throw new Error(`Orbit fixture is missing ${path}`);
    cpSync(origin, join(target, path), { recursive: true });
  }
  const dependencies = join(source, "node_modules");
  if (existsSync(dependencies))
    cpSync(dependencies, join(target, "node_modules"), { recursive: true });
}

function lineNumber(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length;
}

function rewritePlan(
  plan: FlightPlan,
  readme: string,
  port: number,
): FlightPlan {
  for (const claim of plan.claims) {
    if (claim.kind === "port_listens") {
      claim.params.port = port;
      claim.params.timeoutMs = 3000;
    }
    for (const occurrence of claim.occurrences) {
      if (claim.kind === "port_listens")
        occurrence.quote = occurrence.quote.replaceAll("3000", String(port));
      if (
        occurrence.location.kind !== "file" ||
        occurrence.location.path !== "README.md"
      )
        continue;
      const startOffset = readme.indexOf(occurrence.quote);
      if (startOffset < 0)
        throw new Error(`Orbit quote is missing: ${claim.id}`);
      const endOffset = startOffset + occurrence.quote.length;
      occurrence.location.startOffset = startOffset;
      occurrence.location.endOffset = endOffset;
      occurrence.location.lineStart = lineNumber(readme, startOffset);
      occurrence.location.lineEnd = lineNumber(readme, endOffset);
    }
    const first = claim.occurrences[0];
    if (!first) throw new Error("Orbit claim has no quote");
    claim.id = claimId(claim.sourceId, first.quote, claim.kind, claim.params);
  }
  plan.sourceHashes.readme = createHash("sha256").update(readme).digest("hex");
  return flightPlanSchema.parse(plan);
}

export function isolateOrbitPort(root: string, port: number): FlightPlan {
  const readmePath = join(root, "README.md");
  const readme = readFileSync(readmePath, "utf8").replaceAll(
    "3000",
    String(port),
  );
  writeFileSync(readmePath, readme);
  const serverPath = join(root, "src/server.js");
  const server = readFileSync(serverPath, "utf8");
  if (!server.includes('process.env.PORT ?? "3000"'))
    throw new Error("Orbit default port could not be isolated");
  writeFileSync(
    serverPath,
    server.replace(
      'process.env.PORT ?? "3000"',
      `process.env.PORT ?? "${port}"`,
    ),
  );
  for (const path of [".env.example", "man/orbit.1"]) {
    const target = join(root, path);
    writeFileSync(
      target,
      readFileSync(target, "utf8").replaceAll("3000", String(port)),
    );
  }
  const planPath = join(root, "flightchecks/flightplan.json");
  const plan = rewritePlan(
    flightPlanSchema.parse(JSON.parse(readFileSync(planPath, "utf8"))),
    readme,
    port,
  );
  writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  writeFileSync(join(root, "flightchecks/flight.test.mjs"), planToTests(plan));
  return plan;
}
