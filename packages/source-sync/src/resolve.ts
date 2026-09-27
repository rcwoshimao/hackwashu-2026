import type { Source } from "@ground-control/sources";
import { relativePathSchema, safePublicUrl } from "@ground-control/sources";
import type { SourceRecord } from "@ground-control/store";
import type { Result } from "./types.ts";

function filePath(source: SourceRecord): string | null {
  try {
    const url = new URL(source.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const repoParts = source.repo.split("/");
    if (
      url.hostname !== "github.com" ||
      parts[0] !== repoParts[0] ||
      parts[1] !== repoParts[1]
    )
      return null;
    const path =
      parts.length === 2 && source.kind === "readme"
        ? "README.md"
        : parts[2] === "blob"
          ? parts.slice(4).map(decodeURIComponent).join("/")
          : "";
    return relativePathSchema.safeParse(path).success ? path : null;
  } catch {
    return null;
  }
}

function wikiPage(source: SourceRecord): string | null {
  try {
    const url = new URL(source.url);
    const prefix = `/${source.repo}/wiki`;
    if (url.hostname !== "github.com" || !url.pathname.startsWith(prefix))
      return null;
    const tail = url.pathname.slice(prefix.length);
    if (tail && !tail.startsWith("/")) return null;
    return decodeURIComponent(tail.slice(1) || "Home").replaceAll("-", " ");
  } catch {
    return null;
  }
}

function confluencePage(
  source: SourceRecord,
  site: string | undefined,
): Source | null {
  try {
    const url = new URL(source.url);
    if (!site || url.hostname !== site || !site.endsWith(".atlassian.net"))
      return null;
    const pageId =
      /\/pages\/(\d+)(?:\/|$)/.exec(url.pathname)?.[1] ??
      url.searchParams.get("pageId");
    if (!pageId || !/^\d+$/.test(pageId)) return null;
    return {
      id: source.id,
      repo: source.repo,
      kind: "confluence",
      site,
      pageId,
      url: source.url,
    };
  } catch {
    return null;
  }
}

export function resolveSource(
  source: SourceRecord,
  confluenceSite?: string,
): Result<Source> {
  if (!safePublicUrl(source.url))
    return { ok: false, error: { code: "unsafe_url" } };
  if (
    source.kind === "readme" ||
    source.kind === "docs" ||
    source.kind === "man"
  ) {
    const path = filePath(source);
    return path
      ? {
          ok: true,
          value: { id: source.id, repo: source.repo, kind: source.kind, path },
        }
      : { ok: false, error: { code: "invalid_source" } };
  }
  if (source.kind === "wiki") {
    const page = wikiPage(source);
    return page
      ? {
          ok: true,
          value: {
            id: source.id,
            repo: source.repo,
            kind: "wiki",
            page,
            url: source.url,
          },
        }
      : { ok: false, error: { code: "invalid_source" } };
  }
  if (source.kind === "confluence") {
    const page = confluencePage(source, confluenceSite);
    return page
      ? { ok: true, value: page }
      : { ok: false, error: { code: "unconfigured" } };
  }
  return {
    ok: true,
    value: { id: source.id, repo: source.repo, kind: "url", url: source.url },
  };
}
