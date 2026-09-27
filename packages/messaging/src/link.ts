import { messageCopy } from "@ground-control/copy";
import { type MessagingCipher, token32 } from "./identity.ts";
import type {
  InboundMessage,
  MessagingStore,
  OutboundRoute,
  Result,
} from "./types.ts";

const linkLifetimeMs = 24 * 60 * 60 * 1_000;
const githubLoginPattern = /^[A-Za-z0-9-]{1,39}$/;
const tokenPattern = /^[A-Za-z0-9_-]{32}$/;
const phonePattern = /^\+[1-9][0-9]{7,14}$/;

export function normalizePhone(value: string): string | null {
  const phone = value.trim().replace(/[\s()-]/g, "");
  return phonePattern.test(phone) ? phone : null;
}

export function createLinkToken(
  store: MessagingStore,
  cipher: MessagingCipher,
  githubLogin: string,
  phone: string,
  route: OutboundRoute,
  nowMs: number,
  token = token32(),
): Result<{ token: string; expiresAt: number }> {
  const address = normalizePhone(phone);
  if (
    !githubLoginPattern.test(githubLogin) ||
    !address ||
    !route.chatId ||
    !tokenPattern.test(token)
  ) {
    return { ok: false, error: { code: "invalid_input" } };
  }
  const expiresAt = nowMs + linkLifetimeMs;
  store.putLinkToken({
    hash: cipher.hash(token),
    githubLogin,
    addressHash: cipher.hash(address),
    routeHash: cipher.hash(route.chatId),
    ...(route.recipientId
      ? { recipientIdHash: cipher.hash(route.recipientId) }
      : {}),
    ...(route.linePhone ? { lineHash: cipher.hash(route.linePhone) } : {}),
    encryptedAddress: cipher.seal(address),
    expiresAt,
  });
  return { ok: true, value: { token, expiresAt } };
}

export function redeemLinkToken(
  store: MessagingStore,
  cipher: MessagingCipher,
  token: string,
  message: InboundMessage,
  nowMs: number,
): Result<{ githubLogin: string; welcome: string }> {
  if (!tokenPattern.test(token) || !message.senderId || !message.chatId) {
    return { ok: false, error: { code: "invalid_input" } };
  }
  const phone = message.senderAddress
    ? normalizePhone(message.senderAddress)
    : null;
  const senderHash = cipher.hash(message.senderId);
  const addressHash = phone ? cipher.hash(phone) : null;
  const record = store.consumeLinkToken(
    cipher.hash(token),
    senderHash,
    addressHash,
    cipher.hash(message.chatId),
    message.linePhone ? cipher.hash(message.linePhone) : null,
    nowMs,
  );
  if (record === null) return { ok: false, error: { code: "not_found" } };
  store.putLink({
    githubLogin: record.githubLogin,
    senderHash,
    addressHash: record.addressHash,
    encryptedAddress: record.encryptedAddress,
    encryptedChatId: cipher.seal(message.chatId),
    ...(message.linePhone
      ? { encryptedLinePhone: cipher.seal(message.linePhone) }
      : {}),
  });
  return {
    ok: true,
    value: {
      githubLogin: record.githubLogin,
      welcome: messageCopy.linkWelcome.replace("{user}", record.githubLogin),
    },
  };
}
