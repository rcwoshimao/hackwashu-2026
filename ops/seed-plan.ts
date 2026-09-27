import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import {
  ClaudeModel,
  extractFlightPlan,
  GeminiModel,
  HeuristicModel,
  type ModelCache,
  type ModelPort,
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
    entrypoints: [
      resolve(import.meta.dir, "../packages/runner/src/embedded.ts"),
    ],
    target: "node",
    format: "esm",
  });
  if (!result.success || !result.outputs[0])
    throw new Error("runner_bundle_failed");
  return `// Ground Control 0.1.0; generated from packages/runner.\n${await result.outputs[0].text()}`;
}

export type SeedOptions = { model?: ModelPort; cache?: ModelCache };

export function selectSeedModel(settings: {
  choice?: string;
  claudeKey?: string;
  geminiKey?: string;
}): ModelPort {
  if (settings.choice === "claude") {
    if (!settings.claudeKey) throw new Error("anthropic_key_required");
    return new ClaudeModel(settings.claudeKey);
  }
  if (settings.choice === "heuristic") return new HeuristicModel();
  if (settings.choice && settings.choice !== "gemini")
    throw new Error("invalid_extraction_model");
  if (settings.geminiKey) return new GeminiModel(settings.geminiKey);
  if (settings.choice === "gemini") throw new Error("gemini_key_required");
  return new HeuristicModel();
}

function seedCache(options: SeedOptions): {
  cache: ModelCache;
  close?: () => void;
} {
  if (options.cache) return { cache: options.cache };
  const dbPath = resolve(process.env.DATABASE_PATH || "data/groundcontrol.db");
  mkdirSync(dirname(dbPath), { recursive: true });
  const cache = new SqliteModelCache(dbPath);
  return { cache, close: () => cache.close() };
}

export async function seedPlan(
  checkout: string,
  repo: string,
  options: SeedOptions = {},
): Promise<object> {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error("invalid_repo");
  const root = resolve(checkout);
  const { docs, linked } = localDocs(root, repo);
  if (docs.length === 0) throw new Error("no_local_docs");
  const { cache, close } = seedCache(options);
  try {
    const model =
      options.model ??
      selectSeedModel({
        ...(process.env.EXTRACTION_MODEL
          ? { choice: process.env.EXTRACTION_MODEL }
          : {}),
        ...(process.env.ANTHROPIC_API_KEY
          ? { claudeKey: process.env.ANTHROPIC_API_KEY }
          : {}),
        ...(process.env.GEMINI_API_KEY
          ? { geminiKey: process.env.GEMINI_API_KEY }
          : {}),
      });
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
    close?.();
  }
}
