import { createHash } from "node:crypto";
import { parseDocument } from "yaml";
import { z } from "zod";
import { type Source, sourceSchema } from "./index.ts";

const httpsUrl = z.url().refine((value) => value.startsWith("https://"));
const configEntrySchema = z.union([
  z.object({ readme: z.string().min(1) }),
  z.object({ docs: z.string().min(1) }),
  z.object({ wiki: z.literal(true) }),
  z.object({ man: z.string().min(1) }),
  z.object({
    confluence: z.object({ site: z.string().min(1), pages: z.array(httpsUrl) }),
  }),
  z.object({ url: httpsUrl, owner: z.string().min(1).optional() }),
]);
const configSchema = z.object({
  sources: z.array(configEntrySchema).default([]),
});

export type GroundControlConfig = z.infer<typeof configSchema>;
export type SourceDiscoveryError = { code: "yaml_error" | "invalid_config" };
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: SourceDiscoveryError };

export function parseGroundControlConfig(
  yaml: string,
): Result<GroundControlConfig> {
  try {
    const document = parseDocument(yaml, { uniqueKeys: true });
    if (document.errors.length > 0)
      return { ok: false, error: { code: "yaml_error" } };
    const parsed = configSchema.safeParse(document.toJS());
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, error: { code: "invalid_config" } };
  } catch {
    return { ok: false, error: { code: "yaml_error" } };
  }
}

function sourceId(repo: string, kind: string, key: string): string {
  const digest = createHash("sha256")
    .update(`${repo}\n${kind}\n${key}`)
    .digest("hex")
    .slice(0, 12);
  return `${kind}_${digest}`;
}

function fileSource(
  repo: string,
  kind: "readme" | "docs" | "man",
  path: string,
): Source {
  return { id: sourceId(repo, kind, path), repo, kind, path };
}

function configuredConfluence(
  repo: string,
  site: string,
  url: string,
): Source | null {
  const parsed = new URL(url);
  if (parsed.hostname !== site) return null;
  const pageId =
    /\/pages\/(\d+)/.exec(parsed.pathname)?.[1] ??
    parsed.searchParams.get("pageId");
  if (!pageId) return null;
  return {
    id: sourceId(repo, "confluence", `${site}:${pageId}`),
    repo,
    kind: "confluence",
    site,
    pageId,
    url,
  };
}

function globMatches(pattern: string, path: string): boolean {
  if (pattern === "docs/**/*.md")
    return /^docs\/(?:.*\/)?[^/]+\.md$/i.test(path);
  if (pattern === "docs/*.md") return /^docs\/[^/]+\.md$/i.test(path);
  return pattern === path;
}

function fromConfig(
  repo: string,
  files: readonly string[],
  config: GroundControlConfig,
): Source[] {
  const sources: Source[] = [];
  for (const entry of config.sources) {
    if ("readme" in entry && files.includes(entry.readme))
      sources.push(fileSource(repo, "readme", entry.readme));
    if ("docs" in entry)
      for (const path of files.filter((file) => globMatches(entry.docs, file)))
        sources.push(fileSource(repo, "docs", path));
    if ("man" in entry && files.includes(entry.man))
      sources.push(fileSource(repo, "man", entry.man));
    if ("wiki" in entry) {
      const url = `https://github.com/${repo}/wiki`;
      sources.push({
        id: sourceId(repo, "wiki", url),
        repo,
        kind: "wiki",
        page: "Home",
        url,
      });
    }
    if ("confluence" in entry)
      for (const url of entry.confluence.pages) {
        const source = configuredConfluence(repo, entry.confluence.site, url);
        if (source) sources.push(source);
      }
    if ("url" in entry) {
      const source: Source = {
        id: sourceId(repo, "url", entry.url),
        repo,
        kind: "url",
        url: entry.url,
        ...(entry.owner ? { owner: entry.owner } : {}),
      };
      sources.push(source);
    }
  }
  return sources;
}

function docsLink(url: string, label: string): boolean {
  return (
    /documentation|docs|guide|manual|getting started|wiki/i.test(label) ||
    /\/(?:docs?|guide|manual|getting-started|wiki)(?:\/|$)/i.test(url)
  );
}

export function mentionedDocUrls(markdown: string): string[] {
  const found = new Set<string>();
  for (const match of markdown.matchAll(
    /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,
  )) {
    const label = match[1] ?? "";
    const url = match[2] ?? "";
    if (!docsLink(url, label)) continue;
    try {
      const parsed = new URL(url);
      if (parsed.username || parsed.password) continue;
      found.add(parsed.toString());
    } catch {
      continue;
    }
    if (found.size >= 20) break;
  }
  return [...found];
}

function linkedSource(repo: string, url: string): Source {
  const parsed = new URL(url);
  const wiki = /^\/[^/]+\/[^/]+\/wiki(?:\/(.*))?$/.exec(parsed.pathname);
  if (parsed.hostname === "github.com" && wiki) {
    let page = wiki[1] ?? "Home";
    try {
      page = decodeURIComponent(page);
    } catch {
      return { id: sourceId(repo, "url", url), repo, kind: "url", url };
    }
    page = page.replaceAll("-", " ");
    return { id: sourceId(repo, "wiki", url), repo, kind: "wiki", page, url };
  }
  if (parsed.hostname.endsWith(".atlassian.net")) {
    const source = configuredConfluence(repo, parsed.hostname, url);
    if (source) return source;
  }
  return { id: sourceId(repo, "url", url), repo, kind: "url", url };
}

export function discoverRepoSources(
  repo: string,
  files: readonly string[],
  readme: string,
  config: GroundControlConfig = { sources: [] },
): Source[] {
  const sources = new Map<string, Source>();
  const readmePath = files.find((path) => /^readme\.md$/i.test(path));
  if (readmePath) {
    const source = fileSource(repo, "readme", readmePath);
    sources.set(source.id, source);
  }
  for (const path of files.filter((file) =>
    /^docs\/(?:.*\/)?[^/]+\.md$/i.test(file),
  )) {
    const source = fileSource(repo, "docs", path);
    sources.set(source.id, source);
  }
  for (const source of fromConfig(repo, files, config))
    sources.set(source.id, source);
  for (const url of mentionedDocUrls(readme)) {
    const source = linkedSource(repo, url);
    sources.set(source.id, source);
  }
  return [...sources.values()].filter(
    (source) => sourceSchema.safeParse(source).success,
  );
}
