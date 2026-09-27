import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { type Candidate, extractCandidates } from "../src/index.ts";

const fixtures = [
  "orbit-starter",
  "cli-compass",
  "library-beacon",
  "workspace-portal",
  "windows-launch",
];

for (const fixture of fixtures) {
  test(`candidate golden: ${fixture}`, () => {
    const markdown = readFileSync(
      new URL(`../../../fixtures/readmes/${fixture}.md`, import.meta.url),
      "utf8",
    );
    const expected = JSON.parse(
      readFileSync(
        new URL(`../fixtures/${fixture}.json`, import.meta.url),
        "utf8",
      ),
    ) as Candidate[];
    assert.deepEqual(extractCandidates(markdown), expected);
  });
}
