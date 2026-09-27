import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import {
  extractFlightPlan,
  GeminiModel,
  HeuristicModel,
  SqliteModelCache,
} from "@ground-control/ai";
import { planToTests } from "@ground-control/plan";
import {
  type DocText,
  discoverRepoSources,
  manToDocText,
  markdownToDocText,
  parseGroundControlConfig,
} from "@ground-control/sources";
import { maxCandidateFileBytes } from "../config/limits.ts";

const excludedDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "flightchecks",
]);

function listFiles(root: string): string[] {
  const found: string[] = [];
  const pending = [root];
  while (pending.length > 0 && found.length < 10_000) {
    const current = pending.pop();
    if (!current) break;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory() && !excludedDirectories.has(entry.name))
        pending.push(full);
      else if (entry.isFile())
        found.push(relative(root, full).split(sep).join("/"));
    }
  }
  return found.sort();
}

function readBounded(root: string, path: string): string {
  const full = resolve(root, path);
  if (!full.startsWith(`${root}${sep}`)) throw new Error("unsafe_source_path");
  if (statSync(full).size > maxCandidateFileBytes)
    throw new Error("source_too_large");
  return readFileSync(full, "utf8");
}

function configText(root: string, files: readonly string[]): string {
  const name = files.find((path) => path === "groundcontrol.yml");
  return name ? readBounded(root, name) : "sources: []";
}

function localDocs(
  root: string,
  repo: string,
): { docs: DocText[]; linked: number } {
  const files = listFiles(root);
  const config = parseGroundControlConfig(configText(root, files));
  if (!config.ok) throw new Error(config.error.code);
  const readmePath = files.find((path) => /^readme\.md$/i.test(path));
  const readme = readmePath ? readBounded(root, readmePath) : "";
  const sources = discoverRepoSources(repo, files, readme, config.value);
  const docs: DocText[] = [];
  for (const source of sources) {
    if (source.kind === "man")
      docs.push(manToDocText(source, readBounded(root, source.path)));
    if (source.kind === "readme" || source.kind === "docs")
      docs.push(markdownToDocText(source, readBounded(root, source.path)));
  }
  return { docs, linked: sources.length - docs.length };
}

async function runnerBundle(): Promise<string> {
  const result = await Bun.build({
    entrypoints: [resolve("packages/runner/src/embedded.ts")],
    target: "node",
    format: "esm",
  });
  if (!result.success || !result.outputs[0])
    throw new Error("runner_bundle_failed");
  return `// Ground Control 0.1.0; generated from packages/runner.\n${await result.outputs[0].text()}`;
}

export async function seedPlan(
  checkout: string,
  repo: string,
): Promise<object> {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error("invalid_repo");
  const root = resolve(checkout);
  const { docs, linked } = localDocs(root, repo);
  if (docs.length === 0) throw new Error("no_local_docs");
  const dbPath = resolve(process.env.DATABASE_PATH || "data/groundcontrol.db");
  mkdirSync(dirname(dbPath), { recursive: true });
  const cache = new SqliteModelCache(dbPath);
  try {
    const model = process.env.GEMINI_API_KEY
      ? new GeminiModel(process.env.GEMINI_API_KEY)
      : new HeuristicModel();
    const result = await extractFlightPlan(repo, docs, model, cache);
    if (!result.ok) throw new Error(result.error.code);
    const runner = await runnerBundle();
    const target = join(root, "flightchecks");
    mkdirSync(target, { recursive: true });
    writeFileSync(
      join(target, "flightplan.json"),
      `${JSON.stringify(result.value.plan, null, 2)}\n`,
    );
    writeFileSync(
      join(target, "flight.test.mjs"),
      planToTests(result.value.plan),
    );
    writeFileSync(join(target, "runner.mjs"), runner);
    return {
      repo,
      checkout: root,
      sources: docs.length,
      linkedSourcesForServer: linked,
      claims: result.value.plan.claims.length,
      modelCalls: model.model === "local-static" ? 0 : result.value.modelCalls,
      tier: model.model === "local-static" ? "static" : "ai",
    };
  } finally {
    cache.close();
  }
}
