import { readFileSync, writeFileSync } from "node:fs";
import { extractCandidates } from "../src/index.ts";

const fixtures = [
  "orbit-starter",
  "cli-compass",
  "library-beacon",
  "workspace-portal",
  "windows-launch",
];

for (const fixture of fixtures) {
  const markdown = readFileSync(
    new URL(`../../../fixtures/readmes/${fixture}.md`, import.meta.url),
    "utf8",
  );
  const candidates = extractCandidates(markdown);
  writeFileSync(
    new URL(`../fixtures/${fixture}.json`, import.meta.url),
    `${JSON.stringify(candidates, null, 2)}\n`,
  );
}
