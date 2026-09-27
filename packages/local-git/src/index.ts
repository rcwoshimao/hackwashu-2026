import { spawnSync } from "node:child_process";

export type GitResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: { code: "git_failed" | "spawn_failed"; operation: string };
    };

const gitTimeoutMs = 5_000;
const gitOutputLimitBytes = 2_000_000;

export type GitCommand = (
  root: string,
  operation: string,
  args: readonly string[],
) => GitResult<string>;

export const systemGitCommand: GitCommand = (root, operation, args) => {
  const result = spawnSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: gitTimeoutMs,
    maxBuffer: gitOutputLimitBytes,
  });
  if (result.error)
    return { ok: false, error: { code: "spawn_failed", operation } };
  if (result.status !== 0 || typeof result.stdout !== "string")
    return { ok: false, error: { code: "git_failed", operation } };
  return { ok: true, value: result.stdout.trim() };
};

export class LocalGit {
  constructor(
    readonly root: string,
    private readonly command: GitCommand = systemGitCommand,
  ) {}

  private run(operation: string, args: readonly string[]): GitResult<string> {
    return this.command(this.root, operation, args);
  }

  init(): GitResult<void> {
    const initialized = this.run("init", ["init", "-q", "-b", "main"]);
    if (!initialized.ok) return initialized;
    const endings = this.run("line_endings", [
      "config",
      "core.autocrlf",
      "false",
    ]);
    if (!endings.ok) return endings;
    const name = this.run("identity", [
      "config",
      "user.name",
      "Ground Control Local",
    ]);
    if (!name.ok) return name;
    const email = this.run("identity", [
      "config",
      "user.email",
      "local-sim@groundcontrol.invalid",
    ]);
    return email.ok ? { ok: true, value: undefined } : email;
  }

  commitAll(message: string): GitResult<string> {
    const added = this.run("add", ["add", "-A"]);
    if (!added.ok) return added;
    const committed = this.run("commit", ["commit", "-q", "-m", message]);
    if (!committed.ok) return committed;
    return this.head();
  }

  head(): GitResult<string> {
    const result = this.run("head", ["rev-parse", "HEAD"]);
    if (!result.ok) return result;
    return /^[0-9a-f]{40,64}$/u.test(result.value)
      ? result
      : { ok: false, error: { code: "git_failed", operation: "head" } };
  }

  applyPatch(path: string): GitResult<void> {
    const checked = this.run("patch_check", ["apply", "--check", "--", path]);
    if (!checked.ok) return checked;
    const applied = this.run("patch_apply", ["apply", "--", path]);
    return applied.ok ? { ok: true, value: undefined } : applied;
  }

  changedFiles(base: string, head: string): GitResult<string[]> {
    const result = this.run("diff", ["diff", "--name-only", base, head]);
    return result.ok
      ? { ok: true, value: result.value.split(/\r?\n/u).filter(Boolean) }
      : result;
  }
}
