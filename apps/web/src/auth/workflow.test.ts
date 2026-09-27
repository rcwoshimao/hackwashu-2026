import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { workflow, workflowForBranch } from "./workflow.ts";

test("downloaded workflow matches the maintained sample and runs each PR once", () => {
  const sample = readFileSync(
    "demo/orbit-app/.github/workflows/ground-control.yml",
    "utf8",
  );
  assert.equal(workflow, sample);
  assert.match(workflow, /branches: \[main\]/);
  assert.doesNotMatch(workflow, /groundcontrol\/\*\*/);
  const downloaded = workflowForBranch(
    "release/v1",
    "https://demo.example/path",
  );
  assert.match(downloaded, /branches: \["release\/v1"\]/);
  assert.match(downloaded, /server: "https:\/\/demo.example"/);
  assert.doesNotMatch(downloaded, /npm ci|flight-checks:/);
  assert.throws(() => workflowForBranch("main", "http://localhost:8877"));
});
