export function normalizePageUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function githubRepoFromPage(raw: string): string | null {
  const normalized = normalizePageUrl(raw);
  if (!normalized) return null;
  const url = new URL(normalized);
  if (url.hostname !== "github.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const landing = parts.length === 2;
  const readme =
    parts.length >= 5 &&
    parts[2] === "blob" &&
    parts.at(-1)?.toLowerCase() === "readme.md";
  if (!landing && !readme) return null;
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? "";
  return /^[\w.-]+$/.test(owner) && /^[\w.-]+$/.test(repo)
    ? `${owner}/${repo}`
    : null;
}

export function docsHostPattern(raw: string, serverUrl: string): string | null {
  const normalized = normalizePageUrl(raw);
  if (!normalized) return null;
  const page = new URL(normalized);
  if (page.hostname === "github.com") return null;
  if (page.origin === new URL(serverUrl).origin) return null;
  if (page.hostname.endsWith(".atlassian.net")) return null;
  return `https://${page.hostname}/*`;
}

export function repoPath(repo: string, serverUrl: string): string | null {
  const [owner, name] = repo.split("/");
  if (!owner || !name || !/^[\w.-]+$/.test(owner + name)) return null;
  return `${serverUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}
