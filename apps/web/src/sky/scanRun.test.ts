import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { RepoData } from "../data.ts";
import { scanRunId } from "./scanRun.ts";

const run = (id: string, origin: RepoData["runs"][number]["origin"]) => ({
  id,
  origin,
  commitSha: "abc123",
  createdAt: "2026-09-26T00:00:00Z",
  verdict: "success",
  failingCount: 0,
});

test("Sky preview uses the public scan even when a deep CI run is newer", () => {
  assert.equal(
    scanRunId([run("deep", "ci"), run("static", "public_scan")], "abc123"),
    "static",
  );
});

test("Sky preview accepts a matching older run without provenance", () => {
  assert.equal(scanRunId([run("old", "unknown")], "abc123"), "old");
  assert.equal(scanRunId([run("deep", "ci")], "abc123"), null);
});
