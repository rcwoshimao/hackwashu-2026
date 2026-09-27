import { randomBytes } from "node:crypto";
import { renderMessage } from "@ground-control/messaging";
import { Octokit } from "@octokit/rest";
import type { SmokePrPort, SmokePrResult } from "./types.ts";

function names(repo: string): { owner: string; repo: string } | null {
  const match = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/u.exec(repo);
  return match ? { owner: match[1] ?? "", repo: match[2] ?? "" } : null;
}

type Target = { owner: string; repo: string };
type Source = { base: string; parent: string; tree: string };

export class OctokitSmokePr implements SmokePrPort {
  private readonly github: Octokit;

  constructor(token: string, client?: Octokit) {
    this.github =
      client ?? new Octokit({ auth: token, userAgent: "ground-control/0.1.0" });
  }

  private async source(
    target: Target,
  ): Promise<Source | "write_denied" | null> {
    const repository = await this.github.rest.repos.get(target);
    if (repository.data.permissions?.push === false) return "write_denied";
    const workflow = await this.github.rest.repos.getContent({
      ...target,
      path: ".github/workflows/ground-control.yml",
      ref: repository.data.default_branch,
    });
    if (Array.isArray(workflow.data) || workflow.data.type !== "file")
      return null;
    for (const path of [
      "flightchecks/flightplan.json",
      "flightchecks/flight.test.mjs",
      "flightchecks/runner.mjs",
    ]) {
      const file = await this.github.rest.repos.getContent({
        ...target,
        path,
        ref: repository.data.default_branch,
      });
      if (Array.isArray(file.data) || file.data.type !== "file") return null;
    }
    const base = repository.data.default_branch;
    const branch = await this.github.rest.repos.getBranch({
      ...target,
      branch: base,
    });
    const parent = branch.data.commit.sha;
    const previous = await this.github.rest.git.getCommit({
      ...target,
      commit_sha: parent,
    });
    return { base, parent, tree: previous.data.tree.sha };
  }

  private async publish(target: Target, source: Source): Promise<string> {
    const commit = await this.github.rest.git.createCommit({
      ...target,
      message: renderMessage("smokePrTitle"),
      tree: source.tree,
      parents: [source.parent],
    });
    const branch = `groundcontrol/smoke-${source.parent.slice(0, 12)}-${randomBytes(3).toString("hex")}`;
    await this.github.rest.git.createRef({
      ...target,
      ref: `refs/heads/${branch}`,
      sha: commit.data.sha,
    });
    const pr = await this.github.rest.pulls.create({
      ...target,
      base: source.base,
      head: branch,
      title: renderMessage("smokePrTitle"),
      body: renderMessage("smokePrBody"),
      draft: false,
    });
    return pr.data.html_url;
  }

  async create(repo: string): Promise<SmokePrResult> {
    const target = names(repo);
    if (!target) return { ok: false, reason: "github_unavailable" };
    try {
      const source = await this.source(target);
      if (!source) return { ok: false, reason: "setup_incomplete" };
      if (source === "write_denied")
        return { ok: false, reason: "github_unavailable" };
      return { ok: true, url: await this.publish(target, source) };
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? error.status
          : null;
      return {
        ok: false,
        reason: status === 404 ? "setup_incomplete" : "github_unavailable",
      };
    }
  }
}
