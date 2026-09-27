import type { Source } from "@ground-control/sources";
import {
  discoverRepoSources,
  parseGroundControlConfig,
  safePublicUrl,
} from "@ground-control/sources";
import type { AppStore, SourceRecord } from "@ground-control/store";
import { resolveSource } from "./resolve.ts";
import type { RepositoryFilePort, Result } from "./types.ts";

type DiscoveryDeps = {
  store: AppStore;
  files: RepositoryFilePort;
  confluenceSite?: string | undefined;
  serviceToken?: string | undefined;
};

function sourceUrl(source: Source, sha: string): string {
  if (
    source.kind !== "readme" &&
    source.kind !== "docs" &&
    source.kind !== "man"
  )
    return source.url;
  const path = source.path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${source.repo}/blob/${sha}/${path}`;
}

function existingSource(
  store: AppStore,
  source: Source,
  site?: string,
): SourceRecord | null {
  const candidates = store
    .listSources(source.repo)
    .filter((item) => item.kind === source.kind);
  if (
    source.kind === "readme" ||
    source.kind === "docs" ||
    source.kind === "man"
  ) {
    return (
      candidates.find((item) => {
        const resolved = resolveSource(item, site);
        return (
          resolved.ok &&
          "path" in resolved.value &&
          resolved.value.path === source.path
        );
      }) ?? null
    );
  }
  return candidates.find((item) => item.url === source.url) ?? null;
}

function record(
  source: Source,
  sha: string,
  previous: SourceRecord | null,
): SourceRecord {
  const url = sourceUrl(source, sha);
  const title =
    "path" in source
      ? source.path
      : source.kind === "wiki"
        ? source.page
        : source.kind === "confluence"
          ? `Page ${source.pageId}`
          : new URL(url).hostname;
  return {
    id: previous?.id ?? source.id,
    repo: source.repo,
    kind: source.kind,
    title,
    url,
    claimCount: previous?.claimCount ?? 0,
  };
}

export async function discoverConnected(
  repo: string,
  userToken: string | undefined,
  deps: DiscoveryDeps,
): Promise<Result<readonly SourceRecord[]>> {
  const connected = deps.store.getRepo(repo);
  if (!connected?.connected)
    return { ok: false, error: { code: "invalid_source" } };
  const credential = userToken || deps.serviceToken;
  if (connected.visibility === "private" && !credential)
    return { ok: false, error: { code: "credential_required" } };
  const inventory = await deps.files.inventory(repo, credential);
  if (!inventory.ok) return inventory;
  const paths = inventory.value.paths;
  const readmePath = paths.find((path) => /^readme\.md$/i.test(path));
  const readme = readmePath
    ? await deps.files.readFile(repo, readmePath, credential)
    : null;
  const config = paths.includes("groundcontrol.yml")
    ? await deps.files.readFile(repo, "groundcontrol.yml", credential)
    : null;
  const parsed = config?.ok
    ? parseGroundControlConfig(config.value.text)
    : null;
  const found = discoverRepoSources(
    repo,
    paths,
    readme?.ok ? readme.value.text : "",
    parsed?.ok ? parsed.value : { sources: [] },
  ).slice(0, 100);
  const records: SourceRecord[] = [];
  for (const source of found) {
    const url = sourceUrl(source, inventory.value.sha);
    if (!safePublicUrl(url)) continue;
    const value = record(
      source,
      inventory.value.sha,
      existingSource(deps.store, source, deps.confluenceSite),
    );
    deps.store.putSource(value);
    records.push(value);
  }
  return { ok: true, value: records };
}
