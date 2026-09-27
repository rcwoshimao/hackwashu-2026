import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData } from "../data.ts";
import { personalScanRepos } from "./personalScans.ts";

function repo(
  name: string,
  overrides: Partial<AccountRepoData> = {},
): AccountRepoData {
  return {
    repo: name,
    visibility: "public",
    canAdmin: true,
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
    ...overrides,
  };
}

test("bulk personal scans include only eligible public projects under the login", () => {
  const repos = [
    repo("owner/one"),
    repo("OWNER/two"),
    repo("organization/project"),
    repo("owner/private", { visibility: "private" }),
    repo("owner/fork", { fork: true }),
    repo("owner/archived", { archived: true }),
  ];
  assert.deepEqual(
    personalScanRepos(repos, "owner").map((item) => item.repo),
    ["owner/one", "OWNER/two"],
  );
});
