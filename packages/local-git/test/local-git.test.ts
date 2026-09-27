import { expect, test } from "bun:test";
import { type GitCommand, LocalGit } from "../src/index.ts";

test("LocalGit uses fixed git arguments for init, commit, patch, and comparison", () => {
  const calls: Array<{ operation: string; args: readonly string[] }> = [];
  const sha = "a".repeat(40);
  const command: GitCommand = (_root, operation, args) => {
    calls.push({ operation, args });
    if (operation === "head") return { ok: true, value: sha };
    if (operation === "diff")
      return { ok: true, value: "src/server.js\nREADME.md" };
    return { ok: true, value: "" };
  };
  const git = new LocalGit("temp-repo", command);
  expect(git.init()).toEqual({ ok: true, value: undefined });
  expect(git.commitAll("baseline")).toEqual({ ok: true, value: sha });
  expect(git.applyPatch("port.patch")).toEqual({ ok: true, value: undefined });
  expect(git.changedFiles("b".repeat(40), sha)).toEqual({
    ok: true,
    value: ["src/server.js", "README.md"],
  });
  expect(calls).toContainEqual({
    operation: "line_endings",
    args: ["config", "core.autocrlf", "false"],
  });
  expect(calls).toContainEqual({
    operation: "patch_check",
    args: ["apply", "--check", "--", "port.patch"],
  });
  expect(calls).toContainEqual({
    operation: "patch_apply",
    args: ["apply", "--", "port.patch"],
  });
});

test("LocalGit stops before applying a rejected patch", () => {
  const calls: string[] = [];
  const command: GitCommand = (_root, operation) => {
    calls.push(operation);
    return { ok: false, error: { code: "git_failed", operation } };
  };
  const result = new LocalGit("temp-repo", command).applyPatch("invalid.patch");
  expect(result).toEqual({
    ok: false,
    error: { code: "git_failed", operation: "patch_check" },
  });
  expect(calls).toEqual(["patch_check"]);
});
