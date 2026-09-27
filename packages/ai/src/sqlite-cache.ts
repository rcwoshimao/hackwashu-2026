import { Database } from "bun:sqlite";
import { checkSchema } from "@ground-control/plan";
import { z } from "zod";
import type { ModelCache, ProposedCheck } from "./types.ts";

const cachedSchema = z.array(
  z.intersection(checkSchema, z.object({ quote: z.string().min(1) })),
);

export class SqliteModelCache implements ModelCache {
  private readonly database: Database;
  constructor(path: string) {
    this.database = new Database(path);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS model_cache (
        cache_key TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      )
    `);
  }

  get(key: string): readonly ProposedCheck[] | null {
    const row = this.database
      .query("SELECT payload FROM model_cache WHERE cache_key = ?")
      .get(key);
    if (typeof row !== "object" || row === null || !("payload" in row))
      return null;
    if (typeof row.payload !== "string") return null;
    try {
      const parsed = cachedSchema.safeParse(JSON.parse(row.payload));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: readonly ProposedCheck[]): void {
    this.database
      .query(
        "INSERT OR REPLACE INTO model_cache (cache_key, payload) VALUES (?, ?)",
      )
      .run(key, JSON.stringify(value));
  }

  close(): void {
    this.database.close();
  }
}
