import { expect, test } from "bun:test";
import { Octokit } from "@octokit/rest";
import { OctokitFixes } from "../src/index.ts";

const oldSha = "a".repeat(40);
const newSha = "b".repeat(40);
type Call = { method: string; path: string; body: unknown };

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("Octokit adapter reads at a commit, makes one draft commit, and checks its own CI status", async () => {
  const calls: Call[] = [];
  const transport = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : null;
    calls.push({ method, path: url.pathname, body });
    if (url.pathname.endsWith("/contents/README.md"))
      return response({
        type: "file",
        encoding: "base64",
        size: 5,
        content: Buffer.from("hello").toString("base64"),
      });
    if (url.pathname === "/repos/demo/orbit-app")
      return response({ default_branch: "main" });
    if (url.pathname.endsWith(`/git/commits/${oldSha}`))
      return response({ tree: { sha: "tree-old" } });
    if (url.pathname.endsWith("/git/trees"))
      return response({ sha: "tree-new" }, 201);
    if (url.pathname.endsWith("/git/commits"))
      return response({ sha: newSha }, 201);
    if (url.pathname.endsWith("/git/refs"))
      return response({ ref: "refs/heads/groundcontrol/fix-test" }, 201);
    if (url.pathname.endsWith("/pulls"))
      return response(
        { html_url: "https://github.com/demo/orbit-app/pull/1" },
        201,
      );
    if (url.pathname.endsWith(`/commits/${newSha}/status`))
      return response({
        statuses: [{ context: "Ground Control", state: "success" }],
      });
    return response({ message: "unexpected endpoint" }, 404);
  };
  const client = new Octokit({ request: { fetch: transport } });
  const github = new OctokitFixes("fixture-token", client);
  expect(await github.readFile("demo/orbit-app", "README.md", oldSha)).toEqual({
    ok: true,
    value: "hello",
  });
  const draft = await github.createDraft({
    repo: "demo/orbit-app",
    baseSha: oldSha,
    branch: "groundcontrol/fix-test",
    files: [{ path: "README.md", content: "hello 8080" }],
    title: "Update port",
    body: "Cited line 24",
  });
  expect(draft).toMatchObject({ ok: true, value: { commitSha: newSha } });
  expect(
    calls.find((call) => call.path.endsWith("/git/trees"))?.body,
  ).toMatchObject({
    base_tree: "tree-old",
    tree: [{ path: "README.md", content: "hello 8080" }],
  });
  expect(
    calls.find((call) => call.path.endsWith("/pulls"))?.body,
  ).toMatchObject({ draft: true, base: "main" });
  expect(await github.groundControlStatus("demo/orbit-app", newSha)).toEqual({
    ok: true,
    value: "success",
  });
});
