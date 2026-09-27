import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import {
  actionMetadata,
  checkedOutCommit,
  metadataForCheckout,
  privateRunRepository,
  readActionEvent,
} from "../src/git-context.ts";
import { loadPrivateRunner, loadRunner, runFlightChecks } from "../src/run.ts";
import type { FlightRunner } from "../src/types.ts";

const orbitPlan = join(
  process.cwd(),
  "demo/orbit-app/flightchecks/flightplan.json",
);

test("run mode records every claim and keeps a failed check in telemetry", async () => {
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-action-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Action fixture escaped temp directory");
  try {
    mkdirSync(join(root, "flightchecks"));
    writeFileSync(
      join(root, "flightchecks/flightplan.json"),
      readFileSync(orbitPlan),
    );
    const runner: FlightRunner = async (plan) =>
      Object.fromEntries(
        plan.claims.map((claim, index) => [
          claim.id,
          {
            status: index === 0 ? "fail" : "pass",
            expected: "documented behavior",
            actual: "observed behavior",
            durationMs: 1,
          },
        ]),
      );
    const telemetry = await runFlightChecks(
      root,
      "team/orbit-app",
      "a".repeat(40),
      runner,
      { codeChanged: true },
    );
    expect(telemetry.results).toHaveLength(17);
    expect(telemetry.results[0]?.status).toBe("fail");
    expect(telemetry.results[0]?.deepLink).toContain("README.md#L9");
    expect(
      JSON.parse(
        readFileSync(join(root, ".groundcontrol/telemetry.json"), "utf8"),
      ),
    ).toEqual(telemetry);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("change metadata compares base and head and separates docs from code", () => {
  const calls: string[][] = [];
  const metadata = actionMetadata(
    process.cwd(),
    {
      number: 42,
      pull_request: {
        base: { sha: "a".repeat(40) },
        head: { sha: "b".repeat(40), user: { login: "fork-owner" } },
        user: { login: "teammate" },
      },
    },
    (_root, args) => {
      calls.push([...args]);
      return ["README.md", "src/server.js", "flightchecks/runner.mjs"];
    },
  );
  expect(calls).toEqual([
    ["diff", "--name-only", "a".repeat(40), "b".repeat(40)],
  ]);
  expect(metadata).toMatchObject({
    authorLogin: "teammate",
    pullRequestNumber: 42,
    docsChanged: true,
    codeChanged: true,
  });
});

test("only a valid pull request event contributes a PR number", () => {
  expect(
    actionMetadata(process.cwd(), { number: 12 }).pullRequestNumber,
  ).toBeUndefined();
  expect(
    actionMetadata(process.cwd(), { number: -1, pull_request: {} })
      .pullRequestNumber,
  ).toBeUndefined();
  expect(
    actionMetadata(process.cwd(), { number: 1.5, pull_request: {} })
      .pullRequestNumber,
  ).toBeUndefined();
});

test("PR metadata applies only when the checked-out commit is the PR head", () => {
  const head = "b".repeat(40);
  const event = {
    number: 42,
    pull_request: { base: { sha: "a".repeat(40) }, head: { sha: head } },
  };
  const diff = () => ["src/server.js"];
  expect(metadataForCheckout(process.cwd(), event, head, diff)).toMatchObject({
    pullRequestNumber: 42,
    codeChanged: true,
  });
  expect(
    metadataForCheckout(process.cwd(), event, "c".repeat(40), diff)
      .pullRequestNumber,
  ).toBeUndefined();
});

test("checked-out commit reads a bounded Git revision and validates its SHA", () => {
  const sha = "a".repeat(40);
  expect(
    checkedOutCommit(process.cwd(), (_root, args) => {
      expect(args).toEqual(["rev-parse", "HEAD"]);
      return [sha];
    }),
  ).toBe(sha);
  expect(checkedOutCommit(process.cwd(), () => ["not-a-sha"])).toBeNull();
});

test("the committed Orbit bundle exports a runner and absent events are empty", async () => {
  expect(typeof (await loadRunner(join(process.cwd(), "demo/orbit-app")))).toBe(
    "function",
  );
  expect(readActionEvent(undefined)).toEqual({});
});

test("runtime permission requires matching private repository metadata for every event", () => {
  const repo = { full_name: "team/orbit-app", private: true };
  const events = [
    { repository: repo, after: "a".repeat(40) },
    { repository: repo, pull_request: { head: { sha: "a".repeat(40) } } },
    { repository: repo },
  ];
  for (const event of events)
    expect(privateRunRepository(event, "team/orbit-app")).toBe(true);
  expect(
    privateRunRepository(
      { repository: { full_name: "team/orbit-app", private: false } },
      "team/orbit-app",
    ),
  ).toBe(false);
  expect(privateRunRepository({ repository: repo }, "other/orbit-app")).toBe(
    false,
  );
  expect(
    privateRunRepository(
      { repository: { full_name: repo.full_name } },
      repo.full_name,
    ),
  ).toBe(false);
  expect(privateRunRepository({}, repo.full_name)).toBe(false);
});

test("run mode refuses public and missing visibility before importing checkout code", async () => {
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-action-gate-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Action fixture escaped temp directory");
  try {
    mkdirSync(join(root, "flightchecks"));
    writeFileSync(
      join(root, "flightchecks/runner.mjs"),
      'import { writeFileSync } from "node:fs"; writeFileSync(new URL("../runner-imported", import.meta.url), "yes"); export async function runPlan() { return {}; }',
    );
    for (const repository of [
      { full_name: "team/orbit-app", private: false },
      { full_name: "team/orbit-app" },
      { full_name: "other/orbit-app", private: true },
    ]) {
      const denied = await loadPrivateRunner(
        root,
        { repository },
        "team/orbit-app",
      );
      expect(denied).toEqual({
        ok: false,
        error: { code: "private_repository_required" },
      });
      expect(existsSync(join(root, "runner-imported"))).toBe(false);
    }
    const allowed = await loadPrivateRunner(
      root,
      { repository: { full_name: "team/orbit-app", private: true } },
      "team/orbit-app",
    );
    expect(allowed.ok).toBe(true);
    expect(readFileSync(join(root, "runner-imported"), "utf8")).toBe("yes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
