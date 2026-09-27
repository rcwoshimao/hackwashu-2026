import { expect, test } from "bun:test";
import { Octokit } from "@octokit/rest";
import { OctokitSmokePr } from "../src/smoke-pr.ts";
import { login, setup } from "./fixture.ts";

const sha = "a".repeat(40);
function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("smoke adapter makes a regular PR from an empty commit after finding the workflow and checks", async () => {
  const calls: { path: string; body: unknown }[] = [];
  const github = new Octokit({
    request: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        const body = init?.body
          ? (JSON.parse(String(init.body)) as unknown)
          : null;
        calls.push({ path, body });
        if (path === "/repos/owner/repo")
          return response({ default_branch: "main" });
        if (path.includes("/contents/")) return response({ type: "file" });
        if (path.endsWith("/branches/main"))
          return response({ commit: { sha } });
        if (path.endsWith(`/git/commits/${sha}`))
          return response({ tree: { sha: "tree" } });
        if (path.endsWith("/git/commits"))
          return response({ sha: "b".repeat(40) }, 201);
        if (path.endsWith("/git/refs")) return response({ ref: "branch" }, 201);
        if (path.endsWith("/pulls"))
          return response(
            { html_url: "https://github.com/owner/repo/pull/2" },
            201,
          );
        return response({ message: "missing" }, 404);
      },
    },
  });
  const result = await new OctokitSmokePr("token", github).create("owner/repo");
  expect(result).toEqual({
    ok: true,
    url: "https://github.com/owner/repo/pull/2",
  });
  expect(
    calls.find((call) => call.path.endsWith("/git/commits") && call.body),
  ).toMatchObject({ body: { tree: "tree", parents: [sha] } });
  expect(calls.some((call) => call.path.endsWith("/git/trees"))).toBe(false);
  expect(
    calls.find((call) => call.path.endsWith("/pulls"))?.body,
  ).toMatchObject({
    draft: false,
    base: "main",
    title: "Test Ground Control deep scan",
  });
  expect(calls.filter((call) => call.path.includes("/contents/")).length).toBe(
    4,
  );
});

test("smoke adapter refuses a PR when generated checks are missing", async () => {
  const calls: string[] = [];
  const github = new Octokit({
    request: {
      fetch: async (input: RequestInfo | URL) => {
        const path = new URL(String(input)).pathname;
        calls.push(path);
        if (path === "/repos/owner/repo")
          return response({ default_branch: "main" });
        if (path.endsWith("ground-control.yml"))
          return response({ type: "file" });
        return response({ message: "missing" }, 404);
      },
    },
  });
  const result = await new OctokitSmokePr("token", github).create("owner/repo");
  expect(result).toEqual({ ok: false, reason: "setup_incomplete" });
  expect(calls.some((path) => path.endsWith("/git/commits"))).toBe(false);
  expect(calls.some((path) => path.endsWith("/pulls"))).toBe(false);
});

test("smoke PR route requires a connected runtime repo and admin session", async () => {
  const requested: string[] = [];
  const { app, store, github } = setup(undefined, {
    smokePr: {
      async create(repo) {
        requested.push(repo);
        return { ok: true, url: "https://github.com/owner/repo/pull/2" };
      },
    },
  });
  store.putRepo({
    repo: "owner/repo",
    visibility: "private",
    connected: true,
    runtimeEnabled: true,
    tokenHash: null,
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  const path = "/api/repos/owner/repo/smoke-pr";
  expect((await app.request(path, { method: "POST" })).status).toBe(401);
  const cookie = await login(app);
  github.permission.canAdmin = false;
  expect(
    (await app.request(path, { method: "POST", headers: { cookie } })).status,
  ).toBe(403);
  github.permission.canAdmin = true;
  const created = await app.request(path, {
    method: "POST",
    headers: { cookie },
  });
  expect(created.status).toBe(201);
  expect(requested).toEqual(["owner/repo"]);
});
