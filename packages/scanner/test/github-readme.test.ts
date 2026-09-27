import { expect, test } from "bun:test";
import type { Octokit } from "@octokit/rest";
import { OctokitPublicGitHub } from "../src/github.ts";

test("public repository without a root README reports the missing README", async () => {
  const missing = Object.assign(new Error("Not Found"), { status: 404 });
  const github = {
    rest: {
      repos: {
        get: async () => ({
          data: {
            private: false,
            archived: false,
            fork: false,
            default_branch: "main",
          },
        }),
        getCommit: async () => ({ data: { sha: "aaaaaaaa" } }),
        getReadme: async () => {
          throw missing;
        },
      },
    },
  } as unknown as Octokit;
  const adapter = new OctokitPublicGitHub(undefined, github);

  expect(await adapter.getRepo("huss2342/workspace")).toEqual({
    ok: false,
    error: { code: "no_markdown_readme" },
  });
});
