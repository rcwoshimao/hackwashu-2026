import type { SourceRecord } from "@ground-control/store";

function segments(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

function wikiPage(parts: readonly string[]): string {
  return (parts.slice(3).join("/") || "Home").replaceAll("-", " ");
}

function belongsToRepo(parts: readonly string[], repo: string): boolean {
  return `${parts[0]}/${parts[1]}` === repo;
}

function sameGitHubPath(
  source: SourceRecord,
  sourceParts: readonly string[],
  pageParts: readonly string[],
): boolean {
  if (source.kind === "wiki")
    return (
      sourceParts[2] === "wiki" &&
      pageParts[2] === "wiki" &&
      wikiPage(sourceParts) === wikiPage(pageParts)
    );
  if (
    source.kind !== "readme" &&
    source.kind !== "docs" &&
    source.kind !== "man"
  )
    return false;
  return (
    sourceParts[2] === "blob" &&
    pageParts[2] === "blob" &&
    sourceParts.length >= 5 &&
    pageParts.length >= 5 &&
    sourceParts.slice(4).join("/") === pageParts.slice(4).join("/")
  );
}

export function sameSourcePage(source: SourceRecord, pageUrl: string): boolean {
  try {
    const sourceUrl = new URL(source.url);
    const page = new URL(pageUrl);
    sourceUrl.hash = "";
    page.hash = "";
    const repoSource = source.kind !== "url" && source.kind !== "confluence";
    if (repoSource && sourceUrl.hostname === "github.com") {
      const sourceParts = segments(sourceUrl);
      const pageParts = segments(page);
      if (
        !belongsToRepo(sourceParts, source.repo) ||
        !belongsToRepo(pageParts, source.repo)
      )
        return false;
    }
    if (sourceUrl.href === page.href) return true;
    if (sourceUrl.hostname !== "github.com" || page.hostname !== "github.com")
      return false;
    const sourceParts = segments(sourceUrl);
    const pageParts = segments(page);
    if (
      !belongsToRepo(sourceParts, source.repo) ||
      !belongsToRepo(pageParts, source.repo)
    )
      return false;
    return sameGitHubPath(source, sourceParts, pageParts);
  } catch {
    return false;
  }
}
