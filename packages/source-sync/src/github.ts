import { Octokit } from "@octokit/rest";
import {
  maxSourceHtmlBytes,
  sourceFetchTimeoutMs,
} from "../../../config/limits.ts";
import type { RepositoryFilePort, Result } from "./types.ts";

function statusOf(error: unknown): number | null {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : null;
}

function clientFor(credential?: string): Octokit {
  return new Octokit({
    ...(credential ? { auth: credential } : {}),
    request: { timeout: sourceFetchTimeoutMs },
    userAgent: "Ground-Control/0.1",
  });
}

export class OctokitRepositoryFiles implements RepositoryFilePort {
  constructor(
    private readonly serviceToken?: string,
    private readonly makeClient: (credential?: string) => Octokit = clientFor,
  ) {}

  async inventory(
    repo: string,
    token?: string,
  ): Promise<Result<{ sha: string; paths: readonly string[] }>> {
    const [owner, name] = repo.split("/");
    if (!owner || !name)
      return { ok: false, error: { code: "invalid_source" } };
    const credential = token || this.serviceToken;
    const octokit = this.makeClient(credential);
    try {
      const metadata = await octokit.rest.repos.get({ owner, repo: name });
      const commit = await octokit.rest.repos.getCommit({
        owner,
        repo: name,
        ref: metadata.data.default_branch,
      });
      const tree = await octokit.rest.git.getTree({
        owner,
        repo: name,
        tree_sha: commit.data.commit.tree.sha,
        recursive: "1",
      });
      if (tree.data.truncated)
        return { ok: false, error: { code: "too_large" } };
      const paths = tree.data.tree
        .filter((item) => item.type === "blob" && typeof item.path === "string")
        .map((item) => item.path as string)
        .slice(0, 10_000);
      return { ok: true, value: { sha: commit.data.sha, paths } };
    } catch (error) {
      return {
        ok: false,
        error: { code: statusOf(error) === 404 ? "not_found" : "http_error" },
      };
    }
  }

  async readFile(
    repo: string,
    path: string,
    token?: string,
  ): Promise<Result<{ text: string; version: string }>> {
    const [owner, name] = repo.split("/");
    if (!owner || !name || !path || path.includes(".."))
      return { ok: false, error: { code: "invalid_source" } };
    const credential = token || this.serviceToken;
    const octokit = this.makeClient(credential);
    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path,
      });
      const data = response.data;
      if (Array.isArray(data) || data.type !== "file" || !data.content)
        return { ok: false, error: { code: "invalid_body" } };
      const textBytes = Buffer.from(data.content.replace(/\s/g, ""), "base64");
      if (textBytes.byteLength > maxSourceHtmlBytes)
        return { ok: false, error: { code: "too_large" } };
      return {
        ok: true,
        value: { text: textBytes.toString("utf8"), version: data.sha },
      };
    } catch (error) {
      return {
        ok: false,
        error: { code: statusOf(error) === 404 ? "not_found" : "http_error" },
      };
    }
  }
}

export class FixtureRepositoryFiles implements RepositoryFilePort {
  constructor(
    private readonly files: ReadonlyMap<
      string,
      { text: string; version: string }
    >,
  ) {}

  async inventory(
    repo: string,
  ): Promise<Result<{ sha: string; paths: readonly string[] }>> {
    const prefix = `${repo}:`;
    const paths = [...this.files.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
    return { ok: true, value: { sha: "fixture-sha", paths } };
  }

  async readFile(
    repo: string,
    path: string,
  ): Promise<Result<{ text: string; version: string }>> {
    const value = this.files.get(`${repo}:${path}`);
    return value
      ? { ok: true, value }
      : { ok: false, error: { code: "not_found" } };
  }
}
