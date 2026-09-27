import { expect, test } from "bun:test";
import { Octokit } from "@octokit/rest";
import { OctokitPrComments, prEvidenceMarker } from "../src/index.ts";

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("Octokit updates its own PR evidence comment and ignores another author's marker", async () => {
  const sha = "a".repeat(40);
  const comments = [
    {
      id: 1,
      body: `${prEvidenceMarker}\nSomeone else's text`,
      user: { login: "other" },
    },
  ];
  let creates = 0;
  let updates = 0;
  const transport = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const path = new URL(String(input)).pathname;
    const method = init?.method ?? "GET";
    if (path.endsWith("/pulls/42") && method === "GET")
      return response({ head: { sha } });
    if (path === "/user") return response({ login: "groundbot" });
    if (path.endsWith("/issues/42/comments") && method === "GET")
      return response(comments);
    if (path.endsWith("/issues/42/comments") && method === "POST") {
      creates += 1;
      const body = JSON.parse(String(init?.body)) as { body: string };
      comments.push({ id: 2, body: body.body, user: { login: "groundbot" } });
      return response(comments[1], 201);
    }
    if (path.endsWith("/issues/comments/2") && method === "PATCH") {
      updates += 1;
      const body = JSON.parse(String(init?.body)) as { body: string };
      const own = comments[1];
      if (!own) throw new Error("Missing own comment");
      own.body = body.body;
      return response(own);
    }
    return response({ message: "unexpected endpoint" }, 404);
  };
  const client = new Octokit({ request: { fetch: transport } });
  const adapter = new OctokitPrComments("fixture-token", client);
  const repo = "demo/orbit-app";
  const oldBody = `${prEvidenceMarker}\nOld evidence`;
  expect(
    await adapter.upsert(repo, 42, sha, prEvidenceMarker, oldBody),
  ).toEqual({
    ok: true,
    value: "created",
  });
  expect(
    await adapter.upsert(repo, 42, sha, prEvidenceMarker, oldBody),
  ).toEqual({
    ok: true,
    value: "unchanged",
  });
  expect(
    await adapter.upsert(
      repo,
      42,
      sha,
      prEvidenceMarker,
      `${prEvidenceMarker}\nNew evidence`,
    ),
  ).toEqual({ ok: true, value: "updated" });
  expect(creates).toBe(1);
  expect(updates).toBe(1);
  expect(comments).toHaveLength(2);
  expect(comments[0]?.body).toContain("Someone else's text");
  expect(
    await adapter.upsert(repo, 42, "b".repeat(40), prEvidenceMarker, oldBody),
  ).toEqual({ ok: false, error: { code: "invalid_input" } });
  expect(creates).toBe(1);
});
