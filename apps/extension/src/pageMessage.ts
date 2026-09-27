import type { ApiResult } from "./api.ts";
import { normalizePageUrl } from "./pages.ts";
import type { ContentMessage, ContentReply, PageClaims } from "./protocol.ts";

export function isPageRequest(value: unknown): value is ContentMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "page-claims" &&
    "url" in value &&
    typeof value.url === "string"
  );
}

export async function handlePageMessage(
  value: unknown,
  senderUrl: string | undefined,
  lookup: (url: string) => Promise<ApiResult<PageClaims>>,
): Promise<ContentReply> {
  if (!isPageRequest(value) || !senderUrl)
    return { ok: false, error: "invalid" };
  const requested = normalizePageUrl(value.url);
  const sender = normalizePageUrl(senderUrl);
  if (
    !requested ||
    !sender ||
    new URL(requested).origin !== new URL(sender).origin
  )
    return { ok: false, error: "invalid" };
  try {
    const response = await lookup(requested);
    return response.ok
      ? { ok: true, value: response.value }
      : {
          ok: false,
          error: response.error === "access" ? "server" : response.error,
        };
  } catch {
    return { ok: false, error: "network" };
  }
}
