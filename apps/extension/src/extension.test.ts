import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { createApi } from "./api.ts";
import { signIn } from "./auth.ts";
import { handlePageMessage } from "./pageMessage.ts";
import {
  docsHostPattern,
  githubRepoFromPage,
  normalizePageUrl,
} from "./pages.ts";
import { watchPage } from "./popupActions.ts";
import type { Claim, PageClaims } from "./protocol.ts";
import {
  clearClaimMarks,
  findClaimMatches,
  indexText,
  wrapClaimMatches,
} from "./textIndex.ts";

const page: PageClaims = {
  known: true,
  canCheck: true,
  repo: "sample/app",
  claims: [],
};

describe("page boundaries", () => {
  test("normalizes URL without sending content and limits GitHub README scans", async () => {
    const requested: string[] = [];
    const reply = await handlePageMessage(
      { kind: "page-claims", url: "https://github.com/sample/app#readme" },
      "https://github.com/sample/app",
      async (url) => {
        requested.push(url);
        return { ok: true, value: page };
      },
    );
    expect(reply.ok).toBe(true);
    expect(requested).toEqual(["https://github.com/sample/app"]);
    expect(githubRepoFromPage("https://github.com/sample/app")).toBe(
      "sample/app",
    );
    expect(
      githubRepoFromPage("https://github.com/sample/app/issues"),
    ).toBeNull();
    expect(normalizePageUrl("javascript:alert(1)")).toBeNull();
  });

  test("rejects content requests for another origin", async () => {
    let called = false;
    const reply = await handlePageMessage(
      { kind: "page-claims", url: "https://private.example/page" },
      "https://github.com/sample/app",
      async () => {
        called = true;
        return { ok: true, value: page };
      },
    );
    expect(reply).toEqual({ ok: false, error: "invalid" });
    expect(called).toBe(false);
  });

  test("API request contains only normalized URL and bearer session", async () => {
    const calls: Array<{
      url: string;
      auth: string | null;
      body: string | null;
    }> = [];
    const fetcher = async (input: string, init: RequestInit) => {
      calls.push({
        url: String(input),
        auth: new Headers(init.headers).get("Authorization"),
        body: typeof init.body === "string" ? init.body : null,
      });
      return Response.json(page);
    };
    const client = createApi({
      baseUrl: "https://ground.example",
      fetcher,
      readToken: async () => "stored-session",
      delay: async () => {},
    });
    const result = await client.pageClaims("https://docs.example/page");
    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      {
        url: "https://ground.example/api/page-claims?url=https%3A%2F%2Fdocs.example%2Fpage",
        auth: "Bearer stored-session",
        body: null,
      },
    ]);
  });
});

describe("Chrome interactions through fake ports", () => {
  test("stores only the token from this extension's redirect", async () => {
    let saved = "";
    let start = "";
    const result = await signIn(
      {
        extensionId: "a".repeat(32),
        redirectUrl: () => `https://${"a".repeat(32)}.chromiumapp.org/`,
        launch: async (url) => {
          start = url;
          return `https://${"a".repeat(32)}.chromiumapp.org/#token=${"t".repeat(32)}`;
        },
        save: async (token) => {
          saved = token;
        },
      },
      "https://ground.example",
    );
    expect(result).toEqual({ ok: true });
    expect(start).toBe(
      `https://ground.example/auth/extension?extensionId=${"a".repeat(32)}`,
    );
    expect(saved).toBe("t".repeat(32));
  });

  test("asks for a docs origin on Watch before adding a URL", async () => {
    const calls: string[] = [];
    const result = await watchPage(
      "https://docs.example.com/guide#top",
      "sample/app",
      7,
      "https://ground.example",
      async (repo, kind, url) => {
        calls.push(`source:${repo}:${kind}:${url}`);
        return { ok: true, value: {} };
      },
      {
        request: async (pattern) => {
          calls.push(`permission:${pattern}`);
          return true;
        },
        registered: async () => [],
        register: async (_id, pattern) => {
          calls.push(`register:${pattern}`);
        },
        inject: async (tab) => {
          calls.push(`inject:${tab}`);
        },
      },
    );
    expect(result).toEqual({ ok: true, immediate: true });
    expect(calls).toEqual([
      "permission:https://docs.example.com/*",
      "source:sample/app:url:https://docs.example.com/guide",
      "register:https://docs.example.com/*",
      "inject:7",
    ]);
    expect(
      docsHostPattern(
        "https://acme.atlassian.net/wiki",
        "https://ground.example",
      ),
    ).toBeNull();
  });

  test("permission denial prevents a docs URL from reaching the server", async () => {
    let sent = false;
    const result = await watchPage(
      "https://docs.example.com/guide",
      "sample/app",
      7,
      "https://ground.example",
      async () => {
        sent = true;
        return { ok: true, value: {} };
      },
      {
        request: async () => false,
        registered: async () => [],
        register: async () => {},
        inject: async () => {},
      },
    );
    expect(result).toEqual({ ok: false, reason: "permission" });
    expect(sent).toBe(false);
  });
});

test("text node marks preserve exact page text across inline nodes", () => {
  const { document } = parseHTML(
    "<html><body><main><p>Server runs on <code>localhost:3000</code> today.</p></main></body></html>",
  );
  const root = document.querySelector("main");
  expect(root).not.toBeNull();
  if (!root) return;
  const before = root.textContent;
  const claim: Claim = {
    id: "port",
    quote: "Server runs on localhost:3000",
    state: "drifting",
    tooltip: "Expected 3000; actual 8080",
    deepLink: "https://ground.example/runs/1",
  };
  const index = indexText(root);
  const matches = findClaimMatches(index, [claim]);
  expect(matches).toHaveLength(1);
  wrapClaimMatches(root, index, matches, () => {});
  expect(root.textContent).toBe(before);
  expect(root.querySelectorAll("mark[data-gc-claim]").length).toBe(2);
  clearClaimMarks(root);
  expect(root.textContent).toBe(before);
});

test("verified, drifting and unconfirmed claims use separate mark states", () => {
  const { document } = parseHTML(
    "<html><body><main>Alpha. Bravo. Charlie.</main></body></html>",
  );
  const root = document.querySelector("main");
  expect(root).not.toBeNull();
  if (!root) return;
  const original = root.textContent;
  const claims: Claim[] = [
    { id: "a", quote: "Alpha", state: "verified", tooltip: "", deepLink: null },
    { id: "b", quote: "Bravo", state: "drifting", tooltip: "", deepLink: null },
    {
      id: "c",
      quote: "Charlie",
      state: "unconfirmed",
      tooltip: "",
      deepLink: null,
    },
  ];
  const index = indexText(root);
  wrapClaimMatches(root, index, findClaimMatches(index, claims), () => {});
  expect(
    Array.from(root.querySelectorAll("mark")).map((mark) =>
      mark.getAttribute("data-state"),
    ),
  ).toEqual(["verified", "drifting", "unconfirmed"]);
  expect(root.textContent).toBe(original);
});
