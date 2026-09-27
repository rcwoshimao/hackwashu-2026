import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  GeminiModel,
  HeuristicModel,
  SqliteModelCache,
} from "@ground-control/ai";
import { OctokitPublicGitHub, PublicScanner } from "@ground-control/scanner";
import {
  type AppStore,
  type SatelliteRecord,
  SqliteStore,
} from "@ground-control/store";

function option(
  args: readonly string[],
  name: string,
  fallback: string,
): string {
  const index = args.indexOf(name);
  return index < 0 ? fallback : (args[index + 1] ?? fallback);
}

function countOption(
  args: readonly string[],
  name: string,
  fallback: number,
): number {
  const value = Number(option(args, name, String(fallback)));
  if (!Number.isInteger(value) || value < 1 || value > 500)
    throw new Error("invalid_count");
  return value;
}

function storeForOps(): AppStore {
  const path = resolve(process.env.DATABASE_PATH || "data/groundcontrol.db");
  mkdirSync(dirname(path), { recursive: true });
  return new SqliteStore(path);
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] ?? null)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function snapshot(store: AppStore): object {
  const satellites = store
    .listSatellites()
    .filter(
      (item) =>
        item.simulated || store.getRepo(item.repo)?.visibility !== "private",
    );
  const real = satellites.filter((item) => !item.simulated);
  return {
    mode: "cached",
    updatedAt: new Date().toISOString(),
    satellites,
    findings: {
      realCount: real.length,
      driftingCount: real.filter((item) => item.label === "Drifting").length,
      medianLagDays: median(real.map((item) => item.readmeLagDays)),
    },
  };
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function simulated(index: number, next: () => number): SatelliteRecord {
  const statuses = ["On course", "Possible drift", "No telemetry", "Drifting"];
  const topics = [
    "Frameworks",
    "UI libraries",
    "Build tools",
    "Back end",
    "Other",
  ];
  const label =
    statuses[Math.floor(next() * statuses.length)] ?? "No telemetry";
  return {
    repo: `simulated/repo-${String(index + 1).padStart(3, "0")}`,
    stars: Math.round(100 + next() * 100_000),
    topicCluster: topics[Math.floor(next() * topics.length)] ?? "Other",
    readmeLagDays: Math.round(next() * 365),
    label,
    driftDegrees: label === "Drifting" ? Math.round(10 + next() * 80) : 0,
    commitSha: "0000000",
    scannedAt: new Date(0).toISOString(),
    tiersRun: [],
    simulated: true,
  };
}

export async function skyCommand(
  command: string,
  args: readonly string[],
): Promise<object> {
  const store = storeForOps();
  if (command === "sky:export") {
    const databasePath = process.env.DATABASE_PATH;
    const path = resolve(
      process.env.SKY_EXPORT_PATH ||
        (databasePath
          ? `${dirname(resolve(databasePath))}/sky.json`
          : "apps/web/public/sky.json"),
    );
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(snapshot(store), null, 2)}\n`);
    return { path, satellites: store.listSatellites().length };
  }
  if (command === "sky:simulate") {
    const target = countOption(
      args,
      "--fill-to",
      countOption(args, "--count", 500),
    );
    const next = random(Number(option(args, "--seed", "42")));
    const existing = store.listSatellites().length;
    for (let index = existing; index < target; index += 1)
      store.putSatellite(simulated(index, next));
    if (store.listSatellites().every((item) => item.simulated))
      store.setSkyMode("simulated");
    return {
      simulated: Math.max(0, target - existing),
      total: store.listSatellites().length,
    };
  }
  if (command !== "sky:scan") throw new Error("unsupported_command");
  const count = countOption(args, "--top", 500);
  const tiers = option(args, "--tiers", "static,ai");
  const key = process.env.GEMINI_API_KEY;
  if (!process.env.GITHUB_SCAN_TOKEN)
    throw new Error("github_scan_token_required");
  if (tiers !== "static" && tiers !== "static,ai")
    throw new Error("invalid_tiers");
  if (tiers === "static,ai" && !key) throw new Error("gemini_key_required");
  const model =
    key && tiers === "static,ai"
      ? new GeminiModel(key, "gemini-3.5-flash-lite")
      : new HeuristicModel();
  const cache = new SqliteModelCache(
    resolve(process.env.DATABASE_PATH || "data/groundcontrol.db"),
  );
  const scanner = new PublicScanner(
    store,
    new OctokitPublicGitHub(process.env.GITHUB_SCAN_TOKEN),
    model,
    cache,
    () => new Date(),
  );
  try {
    return await scanner.scanTop(count);
  } finally {
    cache.close();
  }
}
