import { expect } from "bun:test";
import { HeuristicModel, MemoryModelCache } from "@ground-control/ai";
import type {
  AccountRepositories,
  GitHubPort,
  RepoAccess,
  Result,
} from "@ground-control/auth";
import { AuthService, Sessions } from "@ground-control/auth";
import {
  FixtureRepositoryFiles,
  SourceSync,
} from "@ground-control/source-sync";
import { FixtureWebPage } from "@ground-control/sources";
import { MemoryStore } from "@ground-control/store";
import { createApi, EventHub } from "../src/index.ts";
import type { ApiDeps } from "../src/types.ts";

class FakeGitHub implements GitHubPort {
  calls = 0;
  accountRepos: AccountRepositories = { repos: [], truncated: false };
  permission: RepoAccess = {
    visibility: "private",
    canRead: true,
    canAdmin: true,
  };

  authorizationUrl(state: string): Result<string> {
    return {
      ok: true,
      value: `https://github.com/login/oauth/authorize?state=${state}`,
    };
  }
  async exchangeCode(): Promise<Result<string>> {
    return { ok: true, value: "github-oauth-token" };
  }
  async currentUser(): Promise<Result<{ login: string }>> {
    return { ok: true, value: { login: "maintainer" } };
  }
  async repoAccess(): Promise<Result<RepoAccess>> {
    this.calls += 1;
    return { ok: true, value: this.permission };
  }

  async listRepositories(): Promise<Result<AccountRepositories>> {
    return { ok: true, value: this.accountRepos };
  }
}

export function setup(
  repositoryFiles = new Map<string, { text: string; version: string }>(),
  extra: Partial<Pick<ApiDeps, "smokePr" | "deepFix" | "workflowInstall">> = {},
) {
  const store = new MemoryStore();
  const github = new FakeGitHub();
  let time = new Date("2026-09-26T12:00:00Z");
  const sessions = new Sessions(store, "test-secret", () => time.getTime());
  const auth = new AuthService(github, sessions, "http://localhost:8787", () =>
    time.getTime(),
  );
  const scans: string[] = [];
  const events = new EventHub();
  const sourceSync = new SourceSync({
    store,
    files: new FixtureRepositoryFiles(repositoryFiles),
    web: new FixtureWebPage(
      new Map([
        [
          "https://example.com/guide",
          "<html><body><main><h1>Guide</h1><p>Run npm run dev</p></main></body></html>",
        ],
      ]),
    ),
    confluence: null,
    model: new HeuristicModel(),
    cache: new MemoryModelCache(),
    now: () => time,
  });
  const app = createApi({
    store,
    auth,
    events,
    sourceSync,
    now: () => time,
    publicUrl: "http://localhost:8787",
    clientIp: () => "127.0.0.1",
    scanner: {
      async scan(repo) {
        scans.push(repo);
        return { state: "queued", repo };
      },
    },
    ...extra,
  });
  return {
    app,
    store,
    github,
    sessions,
    auth,
    events,
    sourceSync,
    scans,
    setTime(value: Date) {
      time = value;
    },
  };
}

export async function login(
  app: ReturnType<typeof createApi>,
): Promise<string> {
  const first = await app.request("/auth/github");
  expect(first.status).toBe(302);
  const state = new URL(first.headers.get("location") ?? "").searchParams.get(
    "state",
  );
  const callback = await app.request(
    `/auth/github/callback?code=abc&state=${state}`,
  );
  expect(callback.status).toBe(302);
  return callback.headers.get("set-cookie")?.split(";")[0] ?? "";
}

export async function json(
  app: ReturnType<typeof createApi>,
  path: string,
  data: unknown,
  headers: HeadersInit = {},
) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
}
