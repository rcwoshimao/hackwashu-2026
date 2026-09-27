import { resolve } from "node:path";
import {
  OctokitPlanWriter,
  publishFlightPlan,
} from "@ground-control/publisher";
import { SqliteStore } from "@ground-control/store";

export async function publishSavedPlan(repo: string): Promise<object> {
  const token = process.env.GITHUB_WRITE_TOKEN;
  if (!token) throw new Error("github_write_token_required");
  const store = new SqliteStore(
    resolve(process.env.DATABASE_PATH || "data/groundcontrol.db"),
  );
  const result = await publishFlightPlan(
    store,
    repo,
    new OctokitPlanWriter(token),
  );
  if (!result.ok) throw new Error(result.error.code);
  return { repo, ...result.value };
}
