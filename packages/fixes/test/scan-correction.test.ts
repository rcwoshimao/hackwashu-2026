import { expect, test } from "bun:test";
import { FixtureDocFixer } from "@ground-control/ai";
import type { RunClaim, RunRecord } from "@ground-control/store";
import { FakeGitHubFixes, ScanCorrection } from "../src/index.ts";

const repo = "maintainer/docs";
const sha = "b".repeat(40);
const readme = [
  "# Docs",
  "",
  "See docs/setup.md for setup.",
  "Run `npm run serve` to start.",
  "",
].join("\n");

function finding(
  claimId: string,
  line: number,
  claim: Pick<RunClaim, "kind" | "params" | "quote">,
): RunClaim {
  return {
    ...claim,
    claimId,
    sourceId: "readme_1",
    state: "disputed",
    status: "fail",
    expected: JSON.stringify(claim.params),
    actual: "fail",
    deepLink: `https://github.com/${repo}/blob/${sha}/README.md#L${line}-L${line}`,
  } as RunClaim;
}

function scanRun(results: RunClaim[]): RunRecord {
  return {
    id: "run_scan",
    repo,
    commitSha: sha,
    createdAt: "2026-09-27T00:00:00Z",
    verdict: "success",
    origin: "public_scan",
    results,
    evidence: [],
  };
}

function github() {
  const fake = new FakeGitHubFixes();
  fake.putFile(repo, sha, "README.md", readme);
  fake.putFile(repo, sha, "docs/install.md", "# Install");
  fake.putFile(
    repo,
    sha,
    "package.json",
    JSON.stringify({ scripts: { start: "node ." } }),
  );
  return fake;
}

const pathClaim = finding("c_aaaaaaaaaa", 3, {
  kind: "file_exists",
  params: { path: "docs/setup.md" },
  quote: "docs/setup.md",
});
const scriptClaim = finding("c_bbbbbbbbbb", 4, {
  kind: "script_exists",
  params: { script: "serve" },
  quote: "npm run serve",
});

test("drafts one pull request that edits only the cited README lines", async () => {
  const fake = github();
  const model = new FixtureDocFixer((input) => ({
    replacement: input.cited.text
      .replace("docs/setup.md", "docs/install.md")
      .replace("npm run serve", "npm start"),
    summary: `Fix ${input.finding.kind}`,
  }));
  const fixed = await new ScanCorrection(model).fix(
    fake,
    scanRun([pathClaim, scriptClaim]),
    [pathClaim.claimId, scriptClaim.claimId],
  );
  expect(fixed.ok).toBe(true);
  if (!fixed.ok) return;
  expect(fixed.value.fixedClaimIds).toEqual([
    pathClaim.claimId,
    scriptClaim.claimId,
  ]);
  expect(fake.drafts).toHaveLength(1);
  const draft = fake.drafts[0];
  expect(draft?.branch).toMatch(/^groundcontrol\/fix-scan-[0-9a-f]{12}-/);
  expect(draft?.files).toEqual([
    {
      path: "README.md",
      content: [
        "# Docs",
        "",
        "See docs/install.md for setup.",
        "Run `npm start` to start.",
        "",
      ].join("\n"),
    },
  ]);
  expect(draft?.title).toContain("2 README mismatches");
  expect(model.inputs[0]?.files).toContain("docs/install.md");
  expect(model.inputs[0]?.packageJson).toContain("start");
  expect(model.inputs[0]?.cited).toEqual({
    startLine: 3,
    endLine: 3,
    text: "See docs/setup.md for setup.",
  });
});

test("skips findings the model cannot correct and reports them", async () => {
  const fake = github();
  const model = new FixtureDocFixer((input) =>
    input.finding.kind === "file_exists"
      ? {
          replacement: "See docs/install.md for setup.",
          summary: "Point to install guide",
        }
      : null,
  );
  const fixed = await new ScanCorrection(model).fix(
    fake,
    scanRun([pathClaim, scriptClaim]),
    [pathClaim.claimId, scriptClaim.claimId],
  );
  expect(fixed.ok && fixed.value.skippedClaimIds).toEqual([
    scriptClaim.claimId,
  ]);
});

test("opens nothing when no finding has a safe correction", async () => {
  const fake = github();
  const unchanged = new FixtureDocFixer((input) => ({
    replacement: input.cited.text,
    summary: "No change",
  }));
  const fixed = await new ScanCorrection(unchanged).fix(
    fake,
    scanRun([pathClaim]),
    [pathClaim.claimId],
  );
  expect(fixed).toEqual({ ok: false, error: { code: "unsupported_drift" } });
  expect(fake.drafts).toHaveLength(0);
});

test("refuses CI runs and ignored findings", async () => {
  const fake = github();
  const model = new FixtureDocFixer(() => ({
    replacement: "changed",
    summary: "changed",
  }));
  const ci = await new ScanCorrection(model).fix(
    fake,
    { ...scanRun([pathClaim]), origin: "ci" },
    [pathClaim.claimId],
  );
  expect(ci.ok).toBe(false);
  const dropped = await new ScanCorrection(model).fix(
    fake,
    scanRun([{ ...pathClaim, state: "dropped" }]),
    [pathClaim.claimId],
  );
  expect(dropped.ok).toBe(false);
  expect(model.inputs).toHaveLength(0);
});
