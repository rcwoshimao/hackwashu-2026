import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData } from "../data.ts";
import { connectableRepos, normalizeGitHubRepo } from "./connectRepo.ts";

function accountRepo(repo: string, canAdmin: boolean): AccountRepoData {
  return {
    repo,
    visibility: "public",
    canAdmin,
    description: null,
    language: null,
    updatedAt: null,
    archived: false,
    fork: false,
    connected: false,
    runtimeEnabled: false,
    checked: false,
    label: null,
    scanned: false,
  };
}

test("public GitHub URL entry resolves to owner/repo", () => {
  assert.equal(normalizeGitHubRepo("owner/repo"), "owner/repo");
  assert.equal(
    normalizeGitHubRepo("https://github.com/owner/repo/"),
    "owner/repo",
  );
  assert.equal(
    normalizeGitHubRepo("https://github.com/owner/repo.git"),
    "owner/repo",
  );
});

test("public GitHub URL entry rejects other sites and subpaths", () => {
  assert.equal(normalizeGitHubRepo("https://example.com/owner/repo"), null);
  assert.equal(
    normalizeGitHubRepo("https://github.com/owner/repo/tree/main"),
    null,
  );
  assert.equal(
    normalizeGitHubRepo("https://github.com/owner/repo?tab=readme"),
    null,
  );
});

test("personal picker lists accessible repos with admin access", () => {
  const repos = [
    accountRepo("owner/zeta", true),
    accountRepo("other/read-only", false),
    accountRepo("owner/alpha", true),
  ];
  assert.deepEqual(
    connectableRepos(repos).map((repo) => repo.repo),
    ["owner/alpha", "owner/zeta"],
  );
});
