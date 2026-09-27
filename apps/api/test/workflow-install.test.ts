import { expect, test } from "bun:test";
import { Octokit } from "@octokit/rest";
import { OctokitWorkflowInstall } from "../src/workflow-install.ts";
import { login, setup } from "./fixture.ts";

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("workflow install commits generated workflow to the default branch", async () => {
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown>;
  }[] = [];
  const github = new Octokit({
    request: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        const body = init?.body
          ? (JSON.parse(String(init.body)) as Record<string, unknown>)
          : {};
        const method = init?.method ?? "GET";
        calls.push({ path, method, body });
        if (path === "/repos/owner/repo")
          return response({ default_branch: "trunk" });
        if (path.includes("ground-control.yml") && init?.method === "PUT")
          return response({ content: { path: body.path } }, 201);
        if (path.includes("ground-control.yml"))
          return response({ message: "Not Found" }, 404);
        return response({ message: "missing" }, 404);
      },
    },
  });
  const result = await new OctokitWorkflowInstall("token", github).install(
    "owner/repo",
    "trunk",
    "https://ground-control.example/path",
  );
  expect(result).toEqual({ ok: true, created: true });
  const put = calls.find((call) => call.method === "PUT");
  expect(put?.body).toMatchObject({
    branch: "trunk",
    message: "Add Ground Control workflow",
  });
  const workflow = Buffer.from(String(put?.body.content), "base64").toString();
  expect(workflow).toContain('branches: ["trunk"]');
  expect(workflow).toContain('server: "https://ground-control.example"');
});

test("workflow install leaves an existing workflow untouched", async () => {
  let writes = 0;
  const github = new Octokit({
    request: {
      fetch: async (input: RequestInfo | URL) => {
        const path = new URL(String(input)).pathname;
        if (path === "/repos/owner/repo")
          return response({ default_branch: "main" });
        if (path.includes("ground-control.yml"))
          return response({ type: "file" });
        writes++;
        return response({ message: "unexpected" }, 404);
      },
    },
  });
  const result = await new OctokitWorkflowInstall("token", github).install(
    "owner/repo",
    "main",
    "https://ground-control.example",
  );
  expect(result).toEqual({ ok: true, created: false });
  expect(writes).toBe(0);
});

test("workflow install route requires connected repo admin access", async () => {
  const requested: string[] = [];
  const { app, store, github } = setup(undefined, {
    workflowInstall: {
      async install(repo, branch, serverUrl) {
        requested.push(`${repo}:${branch}:${serverUrl}`);
        return { ok: true, created: true };
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
  const path = "/api/repos/owner/repo/workflow";
  expect((await app.request(path, { method: "POST" })).status).toBe(401);
  const cookie = await login(app);
  github.permission.canAdmin = false;
  expect(
    (
      await app.request(path, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ branch: "main" }),
      })
    ).status,
  ).toBe(403);
  github.permission.canAdmin = true;
  const created = await app.request(path, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ branch: "main" }),
  });
  expect(created.status).toBe(201);
  expect(requested).toEqual(["owner/repo:main:http://localhost:8787"]);
});
