import { createHash } from "node:crypto";
import { Octokit } from "@octokit/rest";
import type {
  DraftInput,
  DraftResult,
  FixResult,
  GitHubFixPort,
} from "./types.ts";

function parts(repo: string): { owner: string; repo: string } | null {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/u.exec(repo);
  return match ? { owner: match[1] ?? "", repo: match[2] ?? "" } : null;
}

function writable(path: string): boolean {
  return (
    path === "README.md" ||
    /^readme\.(?:md|markdown)$/iu.test(path) ||
    /^docs\/(?:[^/.][^/]*\/)*[^/.][^/]*\.md$/u.test(path) ||
    /^man\/[^/.][^/]*\.[1-9]$/u.test(path) ||
    path === "flightchecks/flightplan.json" ||
    path === "flightchecks/flight.test.mjs"
  );
}

export class OctokitFixes implements GitHubFixPort {
  private readonly client: Octokit;

  constructor(token: string, client?: Octokit) {
    this.client =
      client ?? new Octokit({ auth: token, userAgent: "ground-control/0.1.0" });
  }

  async readFile(
    repo: string,
    path: string,
    ref: string,
  ): Promise<FixResult<string>> {
    const names = parts(repo);
    if (!names || !/^[0-9a-f]{40}$/u.test(ref))
      return { ok: false, error: { code: "github_failed" } };
    try {
      const response = await this.client.rest.repos.getContent({
        ...names,
        path,
        ref,
      });
      const data = response.data;
      if (
        Array.isArray(data) ||
        data.type !== "file" ||
        data.encoding !== "base64"
      )
        return { ok: false, error: { code: "github_failed" } };
      if (data.size > 2_000_000)
        return { ok: false, error: { code: "github_failed" } };
      return {
        ok: true,
        value: Buffer.from(data.content, "base64").toString("utf8"),
      };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }

  async createDraft(input: DraftInput): Promise<FixResult<DraftResult>> {
    const names = parts(input.repo);
    if (
      !names ||
      !/^[0-9a-f]{40}$/u.test(input.baseSha) ||
      !/^groundcontrol\/fix-[A-Za-z0-9_-]{1,64}$/u.test(input.branch) ||
      (input.basePullRequestNumber !== undefined &&
        (!Number.isSafeInteger(input.basePullRequestNumber) ||
          input.basePullRequestNumber < 1)) ||
      input.files.length === 0 ||
      input.files.some((file) => !writable(file.path))
    )
      return { ok: false, error: { code: "github_failed" } };
    try {
      const repository = await this.client.rest.repos.get(names);
      if (repository.data.permissions?.push === false)
        return { ok: false, error: { code: "github_failed" } };
      let base = repository.data.default_branch;
      if (input.basePullRequestNumber !== undefined) {
        const source = await this.client.rest.pulls.get({
          ...names,
          pull_number: input.basePullRequestNumber,
        });
        if (
          source.data.head.repo?.full_name !== input.repo ||
          source.data.head.sha !== input.baseSha
        )
          return { ok: false, error: { code: "github_failed" } };
        base = source.data.head.ref;
      }
      const old = await this.client.rest.git.getCommit({
        ...names,
        commit_sha: input.baseSha,
      });
      const tree = await this.client.rest.git.createTree({
        ...names,
        base_tree: old.data.tree.sha,
        tree: input.files.map((file) => ({
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          content: file.content,
        })),
      });
      const commit = await this.client.rest.git.createCommit({
        ...names,
        message: input.title,
        tree: tree.data.sha,
        parents: [input.baseSha],
      });
      await this.client.rest.git.createRef({
        ...names,
        ref: `refs/heads/${input.branch}`,
        sha: commit.data.sha,
      });
      const pr = await this.client.rest.pulls.create({
        ...names,
        title: input.title,
        body: input.body,
        head: input.branch,
        base,
        draft: true,
      });
      return {
        ok: true,
        value: {
          url: pr.data.html_url,
          commitSha: commit.data.sha,
          branch: input.branch,
        },
      };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }

  async listFiles(
    repo: string,
    ref: string,
  ): Promise<FixResult<readonly string[]>> {
    const names = parts(repo);
    if (!names || !/^[0-9a-f]{40}$/u.test(ref))
      return { ok: false, error: { code: "github_failed" } };
    try {
      const response = await this.client.rest.git.getTree({
        ...names,
        tree_sha: ref,
        recursive: "true",
      });
      return {
        ok: true,
        value: response.data.tree
          .filter((item) => item.type === "blob" && item.path)
          .map((item) => item.path ?? "")
          .filter((path) => !/(^|\/)node_modules\//u.test(path))
          .slice(0, 400),
      };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }

  async groundControlStatus(
    repo: string,
    commitSha: string,
  ): Promise<FixResult<"success" | "failure" | "pending">> {
    const names = parts(repo);
    if (!names || !/^[0-9a-f]{40}$/u.test(commitSha))
      return { ok: false, error: { code: "github_failed" } };
    try {
      const response = await this.client.rest.repos.getCombinedStatusForRef({
        ...names,
        ref: commitSha,
      });
      const status = response.data.statuses.find(
        (item) => item.context === "Ground Control",
      );
      if (!status) return { ok: true, value: "pending" };
      return {
        ok: true,
        value:
          status.state === "success"
            ? "success"
            : status.state === "failure" || status.state === "error"
              ? "failure"
              : "pending",
      };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }
}

export class FakeGitHubFixes implements GitHubFixPort {
  readonly files = new Map<string, string>();
  readonly drafts: DraftInput[] = [];
  readonly statuses = new Map<string, "success" | "failure" | "pending">();

  putFile(repo: string, ref: string, path: string, content: string): void {
    this.files.set(`${repo}\n${ref}\n${path}`, content);
  }

  async readFile(
    repo: string,
    path: string,
    ref: string,
  ): Promise<FixResult<string>> {
    const content = this.files.get(`${repo}\n${ref}\n${path}`);
    return content === undefined
      ? { ok: false, error: { code: "github_failed" } }
      : { ok: true, value: content };
  }

  async listFiles(
    repo: string,
    ref: string,
  ): Promise<FixResult<readonly string[]>> {
    const prefix = `${repo}\n${ref}\n`;
    return {
      ok: true,
      value: [...this.files.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length)),
    };
  }

  async createDraft(input: DraftInput): Promise<FixResult<DraftResult>> {
    this.drafts.push(input);
    const commitSha = createHash("sha1")
      .update(`${input.baseSha}\n${JSON.stringify(input.files)}`)
      .digest("hex");
    for (const file of input.files)
      this.putFile(input.repo, commitSha, file.path, file.content);
    return {
      ok: true,
      value: {
        url: `https://github.com/${input.repo}/pull/${this.drafts.length}`,
        commitSha,
        branch: input.branch,
      },
    };
  }

  async groundControlStatus(
    _repo: string,
    commitSha: string,
  ): Promise<FixResult<"success" | "failure" | "pending">> {
    return { ok: true, value: this.statuses.get(commitSha) ?? "pending" };
  }
}
