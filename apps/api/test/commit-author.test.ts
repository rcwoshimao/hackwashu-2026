import { expect, test } from "bun:test";
import type { Octokit } from "@octokit/rest";
import { OctokitCommitAuthor } from "../src/commit-author.ts";

const sha = "a".repeat(40);

test("commit author adapter uses GitHub's verified commit association", async () => {
  const calls: string[] = [];
  const client = {
    rest: {
      repos: {
        getCommit: async (input: {
          owner: string;
          repo: string;
          ref: string;
        }) => {
          calls.push(`${input.owner}/${input.repo}@${input.ref}`);
          return { data: { author: { login: "actual-committer" } } };
        },
      },
    },
  } as unknown as Octokit;
  const adapter = new OctokitCommitAuthor("fixture-token", client);
  expect(await adapter.lookup("team/orbit-app", sha)).toEqual({
    ok: true,
    login: "actual-committer",
  });
  expect(calls).toEqual([`team/orbit-app@${sha}`]);
  expect(await adapter.lookup("invalid", sha)).toEqual({
    ok: false,
    error: "github_unavailable",
  });
  expect(calls).toHaveLength(1);
});

test("unlinked commit authors never fall back to the PR opener", async () => {
  const client = {
    rest: {
      repos: {
        getCommit: async () => ({ data: { author: null } }),
      },
    },
  } as unknown as Octokit;
  const adapter = new OctokitCommitAuthor("fixture-token", client);
  expect(await adapter.lookup("team/orbit-app", sha)).toEqual({
    ok: true,
    login: null,
  });
});
