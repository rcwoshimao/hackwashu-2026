import { expect, test } from "bun:test";
import { FixtureDocFixer } from "@ground-control/ai";
import type { RunRecord } from "@ground-control/store";
import { DeepCorrection, FakeGitHubFixes } from "../src/index.ts";

const sha = "a".repeat(40);
const repo = "owner/repo";
const source = "# Install\nLoad canvas_extension_zip.\nKeep this line.\n";
function run(quote = "Load canvas_extension_zip."): RunRecord {
  return {
    id: "run-1",
    repo,
    commitSha: sha,
    createdAt: "2026-09-27T00:00:00Z",
    verdict: "failure",
    origin: "ci",
    pullRequestNumber: 7,
    results: [
      {
        claimId: "c_one",
        sourceId: "readme",
        quote,
        kind: "file_exists",
        params: { path: "canvas_extension_zip" },
        state: "confirmed",
        status: "fail",
        expected: "path exists",
        actual: "missing",
        deepLink: `https://github.com/${repo}/blob/${sha}/README.md#L2`,
      },
    ],
    evidence: [],
  };
}

test("deep fix drafts only a cited documentation line and labels its CI origin", async () => {
  const github = new FakeGitHubFixes();
  github.putFile(repo, sha, "README.md", source);
  github.putFile(repo, sha, "package.json", "{}");
  const model = new FixtureDocFixer(() => ({
    replacement: "Load the extension from the repository root.",
    summary: "Correct the extension folder path.",
  }));
  const result = await new DeepCorrection(model).fix(github, run(), ["c_one"]);
  expect(result.ok).toBe(true);
  expect(github.drafts).toHaveLength(1);
  expect(github.drafts[0]).toMatchObject({
    repo,
    baseSha: sha,
    basePullRequestNumber: 7,
    files: [
      {
        path: "README.md",
        content:
          "# Install\nLoad the extension from the repository root.\nKeep this line.\n",
      },
    ],
  });
  expect(github.drafts[0]?.body).toContain(
    "Source: deep scan in the repository's CI",
  );
  expect(github.drafts[0]?.body).toContain("README.md:2");
  expect(model.inputs[0]?.finding.problem).toContain("observed missing");
});

test("deep fix refuses stale cited text and unconfirmed findings", async () => {
  const github = new FakeGitHubFixes();
  github.putFile(repo, sha, "README.md", source);
  const model = new FixtureDocFixer(() => ({
    replacement: "changed",
    summary: "changed",
  }));
  const correction = new DeepCorrection(model);
  expect(
    (await correction.fix(github, run("Different quote"), ["c_one"])).ok,
  ).toBe(false);
  const unconfirmed = {
    ...run(),
    results: run().results.map((item) => ({
      ...item,
      state: "unconfirmed" as const,
    })),
  };
  expect((await correction.fix(github, unconfirmed, ["c_one"])).ok).toBe(false);
  expect(github.drafts).toHaveLength(0);
  expect(model.inputs).toHaveLength(0);
});

test("deep fix leaves command examples to human review", async () => {
  const github = new FakeGitHubFixes();
  github.putFile(
    repo,
    sha,
    "README.md",
    "```sh\nLoad canvas_extension_zip.\n```\n",
  );
  const model = new FixtureDocFixer(() => ({
    replacement: "Run npm install",
    summary: "Change command",
  }));
  const result = await new DeepCorrection(model).fix(github, run(), ["c_one"]);
  expect(result.ok).toBe(false);
  expect(model.inputs).toHaveLength(0);
  expect(github.drafts).toHaveLength(0);
});
