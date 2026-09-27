import { normalizePageUrl } from "./pages.ts";
import type { Claim, ContentReply } from "./protocol.ts";
import {
  clearClaimMarks,
  findClaimMatches,
  indexText,
  wrapClaimMatches,
} from "./textIndex.ts";
import { createTooltip } from "./tooltip.ts";

const debounceMs = 300;

function pageRoot(doc: Document): Element {
  for (const selector of [
    "#readme article",
    "#readme",
    ".wiki-content",
    "main",
  ]) {
    const found = doc.querySelector(selector);
    if (found) return found;
  }
  return doc.body;
}

function start(): void {
  const root = document.documentElement;
  if (root.dataset.gcContentActive) return;
  root.dataset.gcContentActive = "true";
  const tooltip = createTooltip(document);
  let pageUrl: string | null = null;
  let claims: Claim[] = [];
  let timer = 0;
  const observer = new MutationObserver(() => schedule());
  const observe = () =>
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  const render = () => {
    observer.disconnect();
    tooltip.hide();
    const element = pageRoot(document);
    clearClaimMarks(element);
    if (claims.length > 0) {
      const index = indexText(element);
      const matches = findClaimMatches(index, claims);
      wrapClaimMatches(element, index, matches, tooltip.bind);
    }
    observe();
  };
  const update = async () => {
    const current = normalizePageUrl(location.href);
    if (!current) {
      if (pageUrl !== null || claims.length > 0) {
        pageUrl = null;
        claims = [];
        render();
      }
      return;
    }
    if (current === pageUrl) {
      render();
      return;
    }
    pageUrl = current;
    let reply: ContentReply;
    try {
      reply = await chrome.runtime.sendMessage({
        kind: "page-claims",
        url: current,
      });
    } catch {
      pageUrl = null;
      claims = [];
      render();
      return;
    }
    if (pageUrl !== current) return;
    claims = reply.ok ? reply.value.claims : [];
    render();
  };
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void update(), debounceMs);
  };
  observe();
  schedule();
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (
      typeof message === "object" &&
      message !== null &&
      "kind" in message &&
      message.kind === "refresh-claims"
    ) {
      pageUrl = null;
      schedule();
    }
    return false;
  });
  window.addEventListener("popstate", schedule);
  window.setInterval(() => {
    if (normalizePageUrl(location.href) !== pageUrl) schedule();
  }, 500);
}

if (document.body) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
