import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileSystemSnapshot, gitSnapshot } from "../src/index.ts";

test("fileSystemSnapshot confines reads and uses supplied tracked paths", () => {
  const root = mkdtempSync(join(tmpdir(), "ground-control-runner-"));
  try {
    writeFileSync(join(root, "package.json"), "{}", "utf8");
    writeFileSync(join(root, "untracked.txt"), "not tracked", "utf8");
    const result = fileSystemSnapshot(root, ["package.json"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.trackedPaths()).toEqual({
      ok: true,
      value: ["package.json"],
    });
    expect(result.value.pathExists("untracked.txt")).toEqual({
      ok: true,
      value: true,
    });
    expect(result.value.readText("package.json")).toEqual({
      ok: true,
      value: "{}",
    });
    expect(result.value.readText("../outside")).toMatchObject({
      ok: false,
      error: { code: "unsafe_path" },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("gitSnapshot returns typed errors for missing or non-repository roots", () => {
  expect(
    gitSnapshot(join(tmpdir(), "ground-control-absent-root")),
  ).toMatchObject({ ok: false, error: { code: "io_error" } });
  const root = mkdtempSync(join(tmpdir(), "ground-control-runner-"));
  try {
    expect(gitSnapshot(root)).toMatchObject({
      ok: false,
      error: { code: "git_error" },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
