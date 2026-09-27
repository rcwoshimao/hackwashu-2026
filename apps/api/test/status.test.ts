import { expect, test } from "bun:test";
import type { RunRecord } from "@ground-control/store";
import { GitHubCommitStatus } from "../src/index.ts";

const run: RunRecord = {
  id: "run_abc",
  repo: "owner/project",
  commitSha: "abcdef0",
  createdAt: "2026-09-26T12:00:00Z",
  verdict: "failure",
  evidence: [],
  results: [
    {
      claimId: "c_1234567890",
      sourceId: "readme",
      quote: "setup.sh exists",
      kind: "file_exists",
      params: { path: "setup.sh" },
      state: "confirmed",
      status: "fail",
      expected: "exists",
      actual: "missing",
      deepLink: null,
    },
  ],
};

test("commit status targets the run and uses the server verdict", async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fakeFetch = async (input: string, init: RequestInit) => {
    calls.push({ url: String(input), init });
    return Response.json({}, { status: 201 });
  };
  const status = new GitHubCommitStatus(
    "write-token",
    "https://groundcontrol.example",
    fakeFetch,
  );
  expect(await status.post(run)).toBe(true);
  expect(calls[0]?.url).toBe(
    "https://api.github.com/repos/owner/project/statuses/abcdef0",
  );
  const body = JSON.parse(String(calls[0]?.init?.body)) as Record<
    string,
    string
  >;
  expect(body).toMatchObject({
    state: "failure",
    context: "Ground Control",
    target_url: "https://groundcontrol.example/runs/run_abc",
  });
  expect(body.description).toContain("1 confirmed");
  expect(calls[0]?.init?.headers).toMatchObject({
    Authorization: "Bearer write-token",
  });
  expect(
    await new GitHubCommitStatus(
      "",
      "https://groundcontrol.example",
      fakeFetch,
    ).post(run),
  ).toBe(false);
});

test("a successful verdict describes disputed failures as review items", async () => {
  const failed = run.results[0];
  if (!failed) throw new Error("Missing test result");
  const bodies: Record<string, string>[] = [];
  const status = new GitHubCommitStatus(
    "write-token",
    "https://groundcontrol.example",
    async (_url, init) => {
      bodies.push(JSON.parse(String(init.body)) as Record<string, string>);
      return Response.json({}, { status: 201 });
    },
  );
  expect(
    await status.post({
      ...run,
      verdict: "success",
      results: [
        { ...failed, state: "disputed" },
        { ...failed, claimId: "c_2222222222", state: "disputed" },
      ],
    }),
  ).toBe(true);
  expect(bodies[0]?.state).toBe("success");
  expect(bodies[0]?.description).toContain("2 findings need review");
  expect(bodies[0]?.description).not.toContain("checks passed");
});
