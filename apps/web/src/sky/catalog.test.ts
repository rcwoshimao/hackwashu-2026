import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AccountRepoData, Satellite } from "../data.ts";
import { catalogEntries, filterEntries } from "./catalog.ts";

const scan: Satellite = {
  repo: "owner/public",
  stars: 24,
  topicCluster: "Other",
  readmeLagDays: 7,
  label: "On course",
  driftDegrees: 0,
  commitSha: "abcdef0",
  scannedAt: "2026-09-26T12:00:00Z",
  tiersRun: ["static"],
  simulated: false,
};
const account = (
  repo: string,
  visibility: "public" | "private",
): AccountRepoData => ({
  repo,
  visibility,
  canAdmin: true,
  description: null,
  language: null,
  updatedAt: null,
  archived: false,
  fork: false,
  connected: false,
  checked: false,
  label: null,
  scanned: false,
});

test("catalog keeps measured satellites and unscanned account repos distinct", () => {
  const entries = catalogEntries(
    [scan, { ...scan, repo: "demo/orbit", simulated: true }],
    [account("owner/public", "public"), account("owner/private", "private")],
  );
  assert.deepEqual(
    entries.map((entry) => [entry.repo, entry.kind]),
    [
      ["owner/public", "scanned"],
      ["owner/private", "unscanned"],
    ],
  );
  assert.deepEqual(
    filterEntries(entries, "mine", "unscanned", "private").map(
      (entry) => entry.repo,
    ),
    ["owner/private"],
  );
  assert.deepEqual(
    filterEntries(entries, "public", "all", "").map((entry) => entry.repo),
    ["owner/public"],
  );
});

test("private saved checks appear as checked without becoming public satellites", () => {
  const checked = {
    ...account("owner/private", "private"),
    checked: true,
    label: "On course",
  };
  const entries = catalogEntries([], [checked]);
  assert.deepEqual(
    entries.map((entry) => entry.kind),
    ["checked"],
  );
  assert.equal(filterEntries(entries, "private", "scanned", "").length, 1);
  assert.equal(filterEntries(entries, "private", "unscanned", "").length, 0);
});
