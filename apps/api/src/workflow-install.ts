import { renderMessage } from "@ground-control/messaging";
import { Octokit } from "@octokit/rest";
import type { WorkflowInstallPort, WorkflowInstallResult } from "./types.ts";

const workflowPath = ".github/workflows/ground-control.yml";

function targetFor(repo: string): { owner: string; repo: string } | null {
  const match = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/u.exec(repo);
  return match ? { owner: match[1] ?? "", repo: match[2] ?? "" } : null;
}

function workflowFor(branch: string, serverUrl: string): string | null {
  try {
    const origin = new URL(serverUrl);
    if (origin.protocol !== "https:" || origin.username || origin.password)
      return null;
    return `name: Ground Control\non:\n  pull_request:\n  push:\n    branches: [${JSON.stringify(branch)}]\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  ground-control:\n    uses: rcwoshimao/hackwashu-2026/.github/workflows/ground-control-reusable.yml@main\n    with:\n      server: ${JSON.stringify(origin.origin)}\n    secrets:\n      token: \${{ secrets.GROUND_CONTROL_TOKEN }}\n`;
  } catch {
    return null;
  }
}

export class OctokitWorkflowInstall implements WorkflowInstallPort {
  private readonly github: Octokit;

  constructor(token: string, client?: Octokit) {
    this.github =
      client ?? new Octokit({ auth: token, userAgent: "ground-control/0.1.0" });
  }

  async install(
    repo: string,
    branch: string,
    serverUrl: string,
  ): Promise<WorkflowInstallResult> {
    const target = targetFor(repo);
    const content = workflowFor(branch.trim(), serverUrl);
    if (!target || !content || !branch.trim())
      return { ok: false, reason: "github_unavailable" };
    try {
      const repository = await this.github.rest.repos.get(target);
      if (repository.data.permissions?.push === false)
        return { ok: false, reason: "github_unavailable" };
      const existing = await this.github.rest.repos.getContent({
        ...target,
        path: workflowPath,
        ref: repository.data.default_branch,
      });
      if (!Array.isArray(existing.data) && existing.data.type === "file")
        return { ok: true, created: false };
      return { ok: true, created: false };
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? error.status
          : null;
      if (status !== 404) return { ok: false, reason: "github_unavailable" };
    }

    try {
      const repository = await this.github.rest.repos.get(target);
      await this.github.rest.repos.createOrUpdateFileContents({
        ...target,
        path: workflowPath,
        branch: repository.data.default_branch,
        message: renderMessage("workflowInstallCommit"),
        content: Buffer.from(content).toString("base64"),
      });
      return { ok: true, created: true };
    } catch {
      return { ok: false, reason: "github_unavailable" };
    }
  }
}
