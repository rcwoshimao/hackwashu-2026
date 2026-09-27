import { describe, expect, test } from "bun:test";
import type { InboundMessage, MessagingStore } from "../src/index.ts";
import {
  createLinkToken,
  createSpectrumIMessage,
  MemoryMessagingStore,
  MessagingCipher,
  parseCommand,
  RecordingIMessage,
  redeemLinkToken,
  renderMessage,
  SqliteMessagingStore,
  token32,
} from "../src/index.ts";

const phone = "+15551234567";
const linePhone = "+15550000000";
const route = { chatId: "dm-1", recipientId: phone, linePhone };
const token = "a".repeat(32);

function incoming(changes: Partial<InboundMessage> = {}): InboundMessage {
  return {
    id: "inbound-1",
    senderId: phone,
    senderAddress: phone,
    chatId: "dm-1",
    linePhone,
    text: `LINK ${token}`,
    ...changes,
  };
}

function missingAddress(changes: Partial<InboundMessage> = {}): InboundMessage {
  return {
    id: "inbound-1",
    senderId: phone,
    chatId: "dm-1",
    linePhone,
    text: `LINK ${token}`,
    ...changes,
  };
}

function challenge(store: MessagingStore, cipher: MessagingCipher) {
  return createLinkToken(store, cipher, "navi", phone, route, 1_000, token);
}

describe("iMessage identity and commands", () => {
  test("phone-bound code rejects mismatches, expires, and is single use", () => {
    const store = new MemoryMessagingStore();
    const cipher = new MessagingCipher("secret");
    const created = challenge(store, cipher);
    expect(created).toEqual({
      ok: true,
      value: { token, expiresAt: 86_401_000 },
    });
    expect(token32()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(
      redeemLinkToken(
        store,
        cipher,
        token,
        incoming({ senderId: "+15557654321", senderAddress: "+15557654321" }),
        2_000,
      ),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(
      redeemLinkToken(
        store,
        cipher,
        token,
        missingAddress({ senderId: "other", chatId: "dm-2" }),
        2_000,
      ),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(
      redeemLinkToken(
        store,
        cipher,
        token,
        incoming({ linePhone: "+15559999999" }),
        2_000,
      ),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
    const linked = redeemLinkToken(
      store,
      cipher,
      token,
      missingAddress(),
      2_000,
    );
    expect(linked).toMatchObject({ ok: true, value: { githubLogin: "navi" } });
    const saved = store.getLinkBySender(cipher.hash(phone), cipher.hash(phone));
    expect(saved?.encryptedAddress).not.toContain(phone);
    expect(saved?.encryptedChatId).not.toContain("dm-1");
    expect(cipher.open(saved?.encryptedAddress ?? "")).toBe(phone);
    expect(cipher.open(saved?.encryptedLinePhone ?? "")).toBe(linePhone);
    expect(
      redeemLinkToken(store, cipher, token, incoming(), 3_000),
    ).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
    const later = "b".repeat(32);
    createLinkToken(store, cipher, "navi", phone, route, 1_000, later);
    expect(
      redeemLinkToken(store, cipher, later, incoming(), 86_401_000),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  test("command parser accepts the iMessage code and exact reply actions", () => {
    expect(parseCommand(`LINK ${token}`)).toEqual({ kind: "link", token });
    expect(parseCommand(`/start ${token}`)).toEqual({ kind: "unknown" });
    expect(parseCommand(" fIx ")).toEqual({ kind: "fix" });
    expect(parseCommand("KEEP")).toEqual({ kind: "keep" });
    expect(parseCommand("IGNORE")).toEqual({ kind: "ignore" });
    expect(parseCommand("stop")).toEqual({ kind: "stop" });
    expect(parseCommand("status")).toEqual({ kind: "status" });
    expect(parseCommand("help")).toEqual({ kind: "help" });
    expect(parseCommand("CONFIRM c_1234567890")).toEqual({
      kind: "confirm",
      claimId: "c_1234567890",
    });
    expect(parseCommand("DROP c_1234567890")).toEqual({
      kind: "drop",
      claimId: "c_1234567890",
    });
    expect(parseCommand("how do I run owner/repo?")).toEqual({
      kind: "run",
      repo: "owner/repo",
    });
    expect(parseCommand("run owner/repo")).toEqual({
      kind: "run",
      repo: "owner/repo",
    });
    expect(
      parseCommand("See https://github.com/owner/repo/blob/main/README.md"),
    ).toEqual({ kind: "repo", repo: "owner/repo" });
    expect(parseCommand("https://github.com.evil.test/owner/repo")).toEqual({
      kind: "unknown",
    });
    expect(parseCommand("FIX now")).toEqual({ kind: "unknown" });
    expect(parseCommand("2")).toEqual({ kind: "choose", index: 2 });
  });

  test("recording iMessage transport and unconfigured cloud adapter", async () => {
    const imessage = new RecordingIMessage(route);
    expect(await imessage.send(phone, "message")).toMatchObject({
      ok: true,
      value: route,
    });
    expect((await imessage.reply("dm-1", "reply", linePhone)).ok).toBe(true);
    expect(imessage.sent).toEqual([
      { recipientAddress: phone, text: "message" },
    ]);
    expect(imessage.replies).toEqual([
      { chatId: "dm-1", text: "reply", linePhone },
    ]);
    expect(renderMessage("confirmDone", { id: "c_1234567890" })).toContain(
      "c_1234567890",
    );
    expect(
      await createSpectrumIMessage({ projectId: "", projectSecret: "" }),
    ).toEqual({ ok: false, error: { code: "unconfigured" } });
  });

  test("SQLite stores encrypted iMessage links and atomic replay protection", () => {
    const store = new SqliteMessagingStore(":memory:");
    const cipher = new MessagingCipher("secret");
    try {
      expect(challenge(store, cipher).ok).toBe(true);
      expect(redeemLinkToken(store, cipher, token, incoming(), 2_000).ok).toBe(
        true,
      );
      expect(redeemLinkToken(store, cipher, token, incoming(), 2_001).ok).toBe(
        false,
      );
      expect(store.getLinkByGithub("NAVI")?.encryptedChatId).not.toContain(
        "dm-1",
      );
      expect(store.claimInbound("dm-1:42")).toBe(true);
      expect(store.claimInbound("dm-1:42")).toBe(false);
      store.ignore("owner/repo", "c_1234567890");
      expect(store.isIgnored("owner/repo", "c_1234567890")).toBe(true);
    } finally {
      store.close();
    }
  });

  test("SQLite prefers the exact sender when a presented address belongs to another link", () => {
    const store = new SqliteMessagingStore(":memory:");
    const cipher = new MessagingCipher("secret");
    try {
      for (const [login, sender, address] of [
        ["alice", "sender-a", "+15551234567"],
        ["bob", "sender-b", "+15557654321"],
      ] as const) {
        store.putLink({
          githubLogin: login,
          senderHash: cipher.hash(sender),
          addressHash: cipher.hash(address),
          encryptedAddress: cipher.seal(address),
          encryptedChatId: cipher.seal(`${sender}-chat`),
        });
      }
      expect(
        store.getLinkBySender(
          cipher.hash("sender-a"),
          cipher.hash("+15557654321"),
        )?.githubLogin,
      ).toBe("alice");
      expect(
        store.getLinkBySender(
          cipher.hash("new-id"),
          cipher.hash("+15557654321"),
        )?.githubLogin,
      ).toBe("bob");
    } finally {
      store.close();
    }
  });
});
