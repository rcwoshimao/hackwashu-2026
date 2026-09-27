import { copy } from "@ground-control/copy";
import { publicUrl } from "./config.ts";
import type { Claim } from "./protocol.ts";

function statusText(state: Claim["state"]): string {
  return {
    verified: copy.extensionClaimVerified,
    drifting: copy.extensionClaimDrifting,
    unconfirmed: copy.extensionClaimUnconfirmed,
    disputed: copy.extensionClaimDisputed,
  }[state];
}

function safeLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, publicUrl);
    return url.protocol === "https:" || url.origin === publicUrl
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function createTooltip(doc: Document) {
  const host = doc.createElement("div");
  host.id = "gc-tooltip-host";
  const shadow = host.attachShadow({ mode: "open" });
  const style = new CSSStyleSheet();
  style.replaceSync(`:host{position:fixed;z-index:2147483647;inset:0 auto auto 0}
    .card{position:fixed;display:none;max-width:320px;padding:14px;background:#18282e;
    color:#f2f3ed;border:1px solid #627982;box-shadow:0 4px 12px #0d171b;
    font:14px/1.45 system-ui,sans-serif;overflow-wrap:anywhere}
    .card strong{display:block;margin-bottom:6px}.card p{margin:0 0 8px;white-space:pre-wrap}
    .card a{color:#f2b84b;text-underline-offset:3px}`);
  const card = doc.createElement("div");
  card.className = "card";
  card.setAttribute("role", "tooltip");
  shadow.adoptedStyleSheets = [style];
  shadow.append(card);
  doc.documentElement.append(host);
  let timer = 0;
  const hide = () => {
    card.style.display = "none";
  };
  const scheduleHide = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(hide, 150);
  };
  card.addEventListener("mouseenter", () => window.clearTimeout(timer));
  card.addEventListener("mouseleave", scheduleHide);
  return {
    bind(mark: HTMLElement, claim: Claim) {
      const evidence = claim.tooltip || copy.extensionEvidenceUnavailable;
      mark.setAttribute(
        "aria-label",
        `${statusText(claim.state)}. ${claim.quote}. ${evidence}`,
      );
      const show = () => {
        window.clearTimeout(timer);
        card.replaceChildren();
        const title = doc.createElement("strong");
        title.textContent = statusText(claim.state);
        const detail = doc.createElement("p");
        detail.textContent = evidence;
        card.append(title, detail);
        const link = safeLink(claim.deepLink);
        if (link && claim.state === "drifting") {
          const anchor = doc.createElement("a");
          anchor.href = link;
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
          anchor.textContent = copy.extensionOpenFix;
          card.append(anchor);
        }
        const rect = mark.getBoundingClientRect();
        card.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - 336))}px`;
        card.style.top = `${Math.min(innerHeight - 90, rect.bottom + 8)}px`;
        card.style.display = "block";
      };
      mark.addEventListener("mouseenter", show);
      mark.addEventListener("focus", show);
      mark.addEventListener("mouseleave", scheduleHide);
      mark.addEventListener("blur", scheduleHide);
    },
    hide,
  };
}
