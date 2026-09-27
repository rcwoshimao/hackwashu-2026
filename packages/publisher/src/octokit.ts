import { createHash } from "node:crypto";
import { Octokit } from "@octokit/rest";
import type { FileUpdate, PlanWritePort, PublishResult } from "./index.ts";

function parts(repo: string): { owner: string; repo: string } | null {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/u.exec(repo);
  return match ? { owner: match[1] ?? "", repo: match[2] ?? "" } : null;
}

function allowed(files: readonly FileUpdate[]): boolean {
  const paths = new Set(files.map((file) => file.path));
  return (
    paths.size === 3 &&
    paths.has("flightchecks/flightplan.json") &&
    paths.has("flightchecks/flight.test.mjs") &&
    paths.has("flightchecks/runner.mjs") &&
    files.every((file) => file.content.length < 2_000_000)
  );
}

export class OctokitPlanWriter implements PlanWritePort {
  private readonly client: Octokit;
  constructor(token: string, client?: Octokit) {
    this.client =
      client ??
      new Octokit({
        auth: token,
        request: { timeout: 10_000 },
        userAgent: "Ground-Control/0.1",
      });
  }

  private async same(
    names: { owner: string; repo: string },
    sha: string,
    files: readonly FileUpdate[],
  ): Promise<boolean> {
    const current = await Promise.all(
      files.map(async (file) => {
        try {
          const response = await this.client.rest.repos.getContent({
            ...names,
            path: file.path,
            ref: sha,
          });
          const data = response.data;
          if (Array.isArray(data) || data.type !== "file") return null;
          return Buffer.from(data.content, "base64").toString("utf8");
        } catch {
          return null;
        }
      }),
    );
    return files.every((file, index) => current[index] === file.content);
  }

  async publish(
    repo: string,
    files: readonly FileUpdate[],
    visibility: "public" | "private",
  ): Promise<PublishResult> {
    const names = parts(repo);
    if (!names || !allowed(files))
      return { ok: false, error: { code: "github_failed" } };
    try {
      const metadata = await this.client.rest.repos.get(names);
      if (metadata.data.private !== (visibility === "private"))
        return { ok: false, error: { code: "repository_visibility_changed" } };
      if (metadata.data.permissions?.push === false)
        return { ok: false, error: { code: "github_failed" } };
      const branch = metadata.data.default_branch;
      const ref = await this.client.rest.git.getRef({
        ...names,
        ref: `heads/${branch}`,
      });
      const headSha = ref.data.object.sha;
      if (await this.same(names, headSha, files))
        return { ok: true, value: { state: "unchanged", commitSha: headSha } };
      const head = await this.client.rest.git.getCommit({
        ...names,
        commit_sha: headSha,
      });
      const tree = await this.client.rest.git.createTree({
        ...names,
        base_tree: head.data.tree.sha,
        tree: files.map((file) => ({
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          content: file.content,
        })),
      });
      const commit = await this.client.rest.git.createCommit({
        ...names,
        message: "Update flight checks from documentation sources",
        tree: tree.data.sha,
        parents: [headSha],
      });
      await this.client.rest.git.updateRef({
        ...names,
        ref: `heads/${branch}`,
        sha: commit.data.sha,
        force: false,
      });
      return {
        ok: true,
        value: { state: "published", commitSha: commit.data.sha },
      };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }
}

export class FakePlanWriter implements PlanWritePort {
  readonly files = new Map<string, readonly FileUpdate[]>();
  readonly writes: string[] = [];
  async publish(
    repo: string,
    files: readonly FileUpdate[],
    _visibility: "public" | "private",
  ): Promise<PublishResult> {
    if (!allowed(files)) return { ok: false, error: { code: "github_failed" } };
    const previous = this.files.get(repo);
    const commitSha = createHash("sha1")
      .update(`${repo}\n${JSON.stringify(files)}`)
      .digest("hex");
    if (JSON.stringify(previous) === JSON.stringify(files))
      return { ok: true, value: { state: "unchanged", commitSha } };
    this.files.set(repo, files);
    this.writes.push(repo);
    return { ok: true, value: { state: "published", commitSha } };
  }
}
