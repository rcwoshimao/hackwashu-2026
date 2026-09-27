import { expect, test } from "bun:test";
import type { Octokit } from "@octokit/rest";
import { OctokitRepositoryFiles } from "../src/github.ts";

test("repository inventory reads the default branch tree SHA with the user credential", async () => {
  const credentials: (string | undefined)[] = [];
  const treeShas: string[] = [];
  const fake = {
    rest: {
      repos: {
        get: async () => ({ data: { default_branch: "main" } }),
        getCommit: async () => ({
          data: {
            sha: "commit-sha",
            commit: { tree: { sha: "tree-sha" } },
          },
        }),
      },
      git: {
        getTree: async (input: { tree_sha: string }) => {
          treeShas.push(input.tree_sha);
          return {
            data: {
              truncated: false,
              tree: [
                { type: "blob", path: "README.md" },
                { type: "tree", path: "docs" },
              ],
            },
          };
        },
      },
    },
  } as unknown as Octokit;
  const files = new OctokitRepositoryFiles("service-token", (token) => {
    credentials.push(token);
    return fake;
  });
  expect(await files.inventory("owner/project", "user-token")).toEqual({
    ok: true,
    value: { sha: "commit-sha", paths: ["README.md"] },
  });
  expect(treeShas).toEqual(["tree-sha"]);
  expect(credentials).toEqual(["user-token"]);
});
