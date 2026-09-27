import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import fc from "fast-check";
import { extractCandidates } from "../src/index.ts";

test("finds every required candidate signal in Markdown", () => {
  const markdown = readFileSync(
    new URL("../../../fixtures/readmes/orbit-starter.md", import.meta.url),
    "utf8",
  );
  const candidates = extractCandidates(markdown);
  const signals = new Set(candidates.map((candidate) => candidate.signal));
  assert.deepEqual(
    signals,
    new Set([
      "version",
      "inline_code",
      "env_var",
      "shell_command",
      "localhost_url",
      "http_example",
    ]),
  );
  assert.ok(
    candidates.some(
      (candidate) =>
        candidate.quote === "npm run dev" && candidate.lineStart === 7,
    ),
  );
});

test("ignores shell-looking lines in a non-shell block", () => {
  const markdown = '```json\n{"example": "npm run dev"}\n```\n';
  assert.equal(
    extractCandidates(markdown).some(
      (candidate) => candidate.signal === "shell_command",
    ),
    false,
  );
});

test("keeps source offsets and line numbers for CRLF and Unicode", () => {
  const markdown =
    "# 🚀 Launch\r\nUse `PORT`.\r\n```sh\r\nnpm run dev\r\n```\r\n";
  const command = extractCandidates(markdown).find(
    (candidate) => candidate.quote === "npm run dev",
  );
  assert.ok(command);
  assert.equal(command.lineStart, 4);
  assert.equal(command.lineEnd, 4);
  assert.equal(
    markdown.slice(command.startOffset, command.endOffset),
    command.quote,
  );
});

test("candidate quotes are exact source substrings within cited lines", () => {
  fc.assert(
    fc.property(fc.string({ maxLength: 250 }), (fragment) => {
      const markdown = `# ${fragment}\n\nUse \`PORT\` and Node 24.\n\n\`\`\`sh\nnpm run dev\n\`\`\`\n`;
      for (const candidate of extractCandidates(markdown)) {
        assert.equal(
          candidate.quote,
          markdown.slice(candidate.startOffset, candidate.endOffset),
        );
        const lines = markdown.split(/\r?\n/);
        const cited = lines
          .slice(candidate.lineStart - 1, candidate.lineEnd)
          .join("\n");
        assert.ok(cited.includes(candidate.quote));
      }
    }),
    { numRuns: 1000 },
  );
});

test("candidate order is deterministic", () => {
  const markdown = "Use `PORT` at http://localhost:3000 with Node 24.\n";
  assert.deepEqual(extractCandidates(markdown), extractCandidates(markdown));
});

test("finds bracket environment reads and excludes sentence punctuation from URLs", () => {
  const markdown =
    'Use `process.env["API_KEY"]` at http://localhost:3000/api/health.\n';
  const candidates = extractCandidates(markdown);
  assert.ok(
    candidates.some(
      (candidate) =>
        candidate.signal === "env_var" &&
        candidate.quote === 'process.env["API_KEY"]',
    ),
  );
  assert.ok(
    candidates.some(
      (candidate) =>
        candidate.signal === "localhost_url" &&
        candidate.quote === "http://localhost:3000/api/health",
    ),
  );
});

test("finds a localhost URL used as a Markdown link destination", () => {
  const markdown = "[Open the app](http://localhost:8787/dashboard)\n";
  const urls = extractCandidates(markdown).filter(
    (candidate) => candidate.signal === "localhost_url",
  );
  assert.equal(urls.length, 1);
  assert.equal(urls[0]?.quote, "http://localhost:8787/dashboard");
});

test("finds commands in an unlabeled or text code block", () => {
  const markdown = "```\nnpm run dev\n```\n\n```text\nbun run check\n```\n";
  const commands = extractCandidates(markdown)
    .filter((candidate) => candidate.signal === "shell_command")
    .map((candidate) => candidate.quote);
  assert.deepEqual(commands, ["npm run dev", "bun run check"]);
});
