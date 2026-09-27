import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData } from "../data.ts";
import { filterAccountRepos } from "./accountRepoFilter.ts";

function repo(name: string, deepChecksSetup: boolean): AccountRepoData {
  return {
    repo: name,
    visibility: "public",
    canAdmin: true,
    description: null,
    language: null,
    updatedAt: null,
    archived: false,
    fork: false,
    connected: true,
    runtimeEnabled: deepChecksSetup,
    deepChecksSetup,
    checked: true,
    label: "On course",
    scanned: true,
  };
}

test("deep-check filter shows only repositories with a saved CI report", () => {
  const repos = [
    repo("owner/active", true),
    { ...repo("owner/waiting", false), runtimeEnabled: true },
  ];
  assert.deepEqual(
    filterAccountRepos(repos, "", "deep_checks").map((item) => item.repo),
    ["owner/active"],
  );
  assert.deepEqual(
    filterAccountRepos(repos, "waiting", "all").map((item) => item.repo),
    ["owner/waiting"],
  );
});
