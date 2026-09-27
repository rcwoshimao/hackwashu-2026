import { describe, expect, test } from "bun:test";
import { Sessions } from "@ground-control/auth";
import { MemoryStore } from "@ground-control/store";
import { sessionSecret } from "../src/session-secret.ts";

describe("session secret selection", () => {
  test("OAuth-backed sessions survive a server restart when SESSION_SECRET is blank", () => {
    const store = new MemoryStore();
    const first = new Sessions(
      store,
      sessionSecret("", "oauth-client-secret"),
      () => 1_000,
    );
    const cookie = first.create("owner", "oauth-token");
    const restarted = new Sessions(
      store,
      sessionSecret(undefined, "oauth-client-secret"),
      () => 2_000,
    );
    expect(restarted.resolve(cookie)?.login).toBe("owner");
    expect(restarted.resolve(cookie)?.oauthToken).toBe("oauth-token");
  });

  test("explicit secret wins and changing OAuth credentials ends old sessions", () => {
    const store = new MemoryStore();
    const explicit = sessionSecret("session-secret", "oauth-client-secret");
    expect(explicit).toBe("session-secret");
    const first = new Sessions(
      store,
      sessionSecret("", "oauth-client-secret"),
      () => 1_000,
    );
    const cookie = first.create("owner", "oauth-token");
    const rotated = new Sessions(
      store,
      sessionSecret("", "different-client-secret"),
      () => 2_000,
    );
    expect(rotated.resolve(cookie)).toBeNull();
  });
});
