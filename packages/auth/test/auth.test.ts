import { describe, expect, test } from "bun:test";
import { MemoryStore } from "../../store/src/memory.ts";
import type {
  AccountRepositories,
  GitHubPort,
  RepoAccess,
  Result,
} from "../src/index.ts";
import { AuthService, GitHubHttp, Sessions } from "../src/index.ts";

class FakeGitHub implements GitHubPort {
  lookups = 0;
  permission: RepoAccess = {
    visibility: "private",
    canRead: true,
    canAdmin: true,
  };

  authorizationUrl(state: string, challenge: string): Result<string> {
    return {
      ok: true,
      value: `https://github.com?state=${state}&challenge=${challenge}`,
    };
  }

  async exchangeCode(): Promise<Result<string>> {
    return { ok: true, value: "oauth-secret" };
  }

  async currentUser(): Promise<Result<{ login: string }>> {
    return { ok: true, value: { login: "navi" } };
  }

  async repoAccess(): Promise<Result<RepoAccess>> {
    this.lookups += 1;
    return { ok: true, value: this.permission };
  }
  async listRepositories(): Promise<Result<AccountRepositories>> {
    return { ok: true, value: { repos: [], truncated: false } };
  }
}

describe("auth", () => {
  test("sessions encrypt tokens, expire in seven days, and can be removed", () => {
    const store = new MemoryStore();
    let now = 1_000;
    const sessions = new Sessions(store, "secret", () => now);
    const raw = sessions.create("navi", "oauth-secret");
    const resolved = sessions.resolve(raw);
    expect(resolved?.oauthToken).toBe("oauth-secret");
    expect(
      JSON.stringify(store.getSession(resolved?.sessionIdHash ?? "")),
    ).not.toContain("oauth-secret");
    sessions.remove(raw);
    expect(sessions.resolve(raw)).toBeNull();
    const another = sessions.create("navi", "oauth-secret");
    now += 7 * 24 * 60 * 60 * 1_000;
    expect(sessions.resolve(another)).toBeNull();
  });

  test("OAuth state is single use for web sign-in", async () => {
    const store = new MemoryStore();
    const github = new FakeGitHub();
    const sessions = new Sessions(store, "secret", Date.now);
    const auth = new AuthService(
      github,
      sessions,
      "http://localhost:8787",
      Date.now,
    );
    const started = auth.begin();
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const state = new URL(started.value).searchParams.get("state") ?? "";
    const completed = await auth.complete("code", state);
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.redirect).toBe("http://localhost:8787/signin");
      expect(auth.session(completed.value.token)?.login).toBe("navi");
    }
    expect(await auth.complete("code", state)).toMatchObject({
      ok: false,
      error: { code: "invalid_state" },
    });
  });

  test("repository access cache rechecks after ten minutes", async () => {
    let now = 0;
    const store = new MemoryStore();
    const github = new FakeGitHub();
    const sessions = new Sessions(store, "secret", () => now);
    const auth = new AuthService(
      github,
      sessions,
      "http://localhost:8787",
      () => now,
    );
    const token = sessions.create("navi", "oauth-secret");
    const session = auth.session(token);
    expect(session).not.toBeNull();
    if (session === null) return;
    await auth.access(session, "owner/project");
    github.permission = {
      visibility: "private",
      canRead: false,
      canAdmin: false,
    };
    expect(await auth.access(session, "owner/project")).toMatchObject({
      ok: true,
      value: { canRead: true },
    });
    expect(github.lookups).toBe(1);
    now += 10 * 60 * 1_000;
    expect(await auth.access(session, "owner/project")).toMatchObject({
      ok: true,
      value: { canRead: false },
    });
    expect(github.lookups).toBe(2);
  });

  test("GitHub adapter uses PKCE and parses access without network", async () => {
    const requests: { url: string; init: RequestInit | undefined }[] = [];
    const fakeFetch = async (input: string, init: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.includes("access_token"))
        return Response.json({ access_token: "token" });
      if (url.endsWith("/user")) return Response.json({ login: "navi" });
      return Response.json({ private: true, permissions: { admin: true } });
    };
    const github = new GitHubHttp("id", "secret", fakeFetch);
    const authorize = github.authorizationUrl(
      "state",
      "challenge",
      "http://localhost/callback",
    );
    expect(authorize.ok).toBe(true);
    if (authorize.ok)
      expect(
        new URL(authorize.value).searchParams.get("code_challenge_method"),
      ).toBe("S256");
    expect(
      await github.exchangeCode(
        "code",
        "verifier",
        "http://localhost/callback",
      ),
    ).toEqual({ ok: true, value: "token" });
    expect(await github.currentUser("token")).toEqual({
      ok: true,
      value: { login: "navi" },
    });
    expect(await github.repoAccess("token", "owner/private")).toMatchObject({
      ok: true,
      value: { visibility: "private", canAdmin: true },
    });
    expect(requests[0]?.url).toBe(
      "https://github.com/login/oauth/access_token",
    );
    expect(String(requests[0]?.init?.body)).toContain(
      '"code_verifier":"verifier"',
    );
  });
});
