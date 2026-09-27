import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  extractFlightPlan,
  GeminiModel,
  SqliteModelCache,
} from "@ground-control/ai";
import { markdownToDocText } from "@ground-control/sources";
import { Octokit } from "@octokit/rest";

export async function pingGitHub(): Promise<object> {
  const token = process.env.GITHUB_SCAN_TOKEN || process.env.GITHUB_WRITE_TOKEN;
  if (!token) throw new Error("github_token_required");
  const client = new Octokit({
    auth: token,
    request: { timeout: 10_000 },
    userAgent: "Ground-Control/0.1",
  });
  const response = await client.rest.rateLimit.get();
  return {
    ok: true,
    github: {
      coreRemaining: response.data.resources.core.remaining,
      searchRemaining: response.data.resources.search.remaining,
    },
  };
}

export async function pingModels(): Promise<object> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("gemini_key_required");
  const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
  const results: Record<string, string> = {};
  for (const name of models) {
    const model = new GeminiModel(key, name);
    const response = await model.extract({
      sectionText: "This package supports Node.js 24.",
      candidates: [{ signal: "version", quote: "Node.js 24" }],
    });
    results[name] = response.ok ? "ok" : response.error.code;
  }
  if (Object.values(results).some((result) => result !== "ok"))
    throw new Error(`model_check_failed:${JSON.stringify(results)}`);
  return { ok: true, models: results };
}

export async function extractFile(
  path: string,
  markdown: string,
): Promise<object> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("gemini_key_required");
  const dbPath = resolve(process.env.DATABASE_PATH || "data/groundcontrol.db");
  mkdirSync(dirname(dbPath), { recursive: true });
  const cache = new SqliteModelCache(dbPath);
  try {
    const source = {
      id: `file_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      repo: "local/inspection",
      kind: "readme" as const,
      path: basename(path),
    };
    const doc = markdownToDocText(source, markdown);
    const result = await extractFlightPlan(
      source.repo,
      [doc],
      new GeminiModel(key),
      cache,
    );
    if (!result.ok) throw new Error(result.error.code);
    return {
      sections: result.value.sections,
      modelCalls: result.value.modelCalls,
      rejected: result.value.rejected,
      claims: result.value.plan.claims,
    };
  } finally {
    cache.close();
  }
}
