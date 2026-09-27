import type { ApiResult } from "./api.ts";
import { docsHostPattern, normalizePageUrl } from "./pages.ts";

export type WatchPort = {
  request: (pattern: string) => Promise<boolean>;
  registered: () => Promise<string[]>;
  register: (id: string, pattern: string) => Promise<void>;
  inject: (tabId: number) => Promise<void>;
};

export type WatchResult =
  | { ok: true; immediate: boolean }
  | { ok: false; reason: "permission" | "source" | "invalid" };

function scriptId(hostname: string): string {
  let hash = 2166136261;
  for (const char of hostname) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `docs-${(hash >>> 0).toString(16)}`;
}

export async function watchPage(
  pageUrl: string,
  repo: string,
  tabId: number,
  serverUrl: string,
  source: (
    repo: string,
    kind: string,
    url: string,
  ) => Promise<ApiResult<unknown>>,
  port: WatchPort,
): Promise<WatchResult> {
  const normalized = normalizePageUrl(pageUrl);
  if (!normalized) return { ok: false, reason: "invalid" };
  const url = new URL(normalized);
  if (url.hostname === "github.com" || url.origin === serverUrl)
    return { ok: false, reason: "invalid" };
  const pattern = docsHostPattern(normalized, serverUrl);
  if (pattern) {
    try {
      if (!(await port.request(pattern)))
        return { ok: false, reason: "permission" };
    } catch {
      return { ok: false, reason: "permission" };
    }
  }
  const kind = url.hostname.endsWith(".atlassian.net") ? "confluence" : "url";
  const added = await source(repo, kind, normalized);
  if (!added.ok) return { ok: false, reason: "source" };
  try {
    if (pattern) {
      const id = scriptId(url.hostname);
      const registered = await port.registered();
      if (!registered.includes(id)) await port.register(id, pattern);
    }
    await port.inject(tabId);
    return { ok: true, immediate: true };
  } catch {
    return { ok: true, immediate: false };
  }
}

export const chromeWatch: WatchPort = {
  request: (pattern) => chrome.permissions.request({ origins: [pattern] }),
  registered: async () =>
    (await chrome.scripting.getRegisteredContentScripts()).map(
      (item) => item.id,
    ),
  register: async (id, pattern) => {
    await chrome.scripting.registerContentScripts([
      {
        id,
        matches: [pattern],
        js: ["content.js"],
        css: ["claims.css"],
        runAt: "document_idle",
        persistAcrossSessions: true,
      },
    ]);
  },
  inject: async (tabId) => {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["claims.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  },
};
