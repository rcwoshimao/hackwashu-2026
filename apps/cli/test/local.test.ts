import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { selectSeedModel } from "../../../ops/seed-plan.ts";
import {
  HeuristicModel,
  MemoryModelCache,
} from "../../../packages/ai/src/index.ts";
import { rerunSavedChecks, scanLocalCheckout } from "../src/local.ts";

function temporaryCheckout(): string {
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-local-unit-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Temporary checkout left the system temp directory");
  return root;
}

test("private local scan initializes and runs static checks without Git", async () => {
  const root = temporaryCheckout();
  try {
    writeFileSync(
      join(root, "README.md"),
      "# Local app\n\nRun `npm run dev`.\n",
    );
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ scripts: { dev: "node app.mjs" } }),
    );
    const scanned = await scanLocalCheckout(root, true, {
      model: new HeuristicModel(),
      cache: new MemoryModelCache(),
    });
    expect(scanned.ok).toBe(true);
    if (!scanned.ok) return;
    expect(scanned.value.repo).toStartWith("local/");
    expect(scanned.value.sources).toBe(1);
    expect(scanned.value.counts.pass).toBe(1);
    expect(scanned.value.results[0]?.kind).toBe("script_exists");
    expect(existsSync(join(root, ".git"))).toBe(false);
    expect(existsSync(join(root, "flightchecks", "runner.mjs"))).toBe(true);
    expect(existsSync(join(root, "flightchecks", "flight.test.mjs"))).toBe(
      true,
    );
    const checked = await rerunSavedChecks(root, true);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.value.counts.pass).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("local scanning and reruns require private opt-in before disk changes", async () => {
  const root = temporaryCheckout();
  try {
    writeFileSync(join(root, "README.md"), "# Local app\n");
    const scan = await scanLocalCheckout(root, false);
    const rerun = await rerunSavedChecks(root, false);
    expect(scan).toEqual({
      ok: false,
      error: { code: "private_confirmation_required" },
    });
    expect(rerun).toEqual(scan);
    expect(existsSync(join(root, "flightchecks"))).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("invalid saved plans are rejected before checks run", async () => {
  const root = temporaryCheckout();
  try {
    const missing = await rerunSavedChecks(root, true);
    expect(missing).toEqual({ ok: false, error: { code: "plan_missing" } });
    const planPath = join(root, "flightchecks");
    mkdirSync(planPath);
    writeFileSync(join(planPath, "flightplan.json"), "{}");
    const invalid = await rerunSavedChecks(root, true);
    expect(invalid).toEqual({ ok: false, error: { code: "plan_invalid" } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Claude extraction is explicit while Gemini and keyless modes remain available", () => {
  expect(selectSeedModel({}).model).toBe("local-static");
  expect(selectSeedModel({ geminiKey: "test-key" }).model).toContain("gemini");
  expect(
    selectSeedModel({ choice: "claude", claudeKey: "test-key" }).model,
  ).toContain("claude");
  expect(() => selectSeedModel({ choice: "claude" })).toThrow(
    "anthropic_key_required",
  );
  expect(() => selectSeedModel({ choice: "gemini" })).toThrow(
    "gemini_key_required",
  );
});
