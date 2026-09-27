import { Octokit } from "@octokit/rest";
import {
  githubSearchIntervalMs,
  githubSearchPageSize,
} from "../../../config/limits.ts";
import { githubStatus, retry, sleep } from "./github-retry.ts";

export type PublicRepo = {
  repo: string;
  sha: string;
  stars: number;
  language: string | null;
  topics: readonly string[];
  pushedAt: string;
  readmeUpdatedAt: string;
  readmePath: string;
  readme: string;
  packageJson: string | null;
};
export type RankedRepo = { repo: string; stars: number };

export type RepoError = {
  code: "not_public" | "no_markdown_readme" | "github_unavailable";
};
export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RepoError };

export interface PublicGitHubPort {
  getRepo(repo: string): Promise<RepoResult<PublicRepo>>;
  pathExists(
    repo: string,
    path: string,
    sha: string,
  ): Promise<RepoResult<boolean>>;
  topRepos(
    language: "JavaScript" | "TypeScript",
    page: number,
  ): Promise<RepoResult<readonly RankedRepo[]>>;
}

function decodeContent(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("content" in data))
    return null;
  const content = data.content;
  if (typeof content !== "string") return null;
  return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8");
}

export class OctokitPublicGitHub implements PublicGitHubPort {
  private readonly octokit: Octokit;
  private nextSearchAtMs = 0;
  constructor(token?: string) {
    this.octokit = new Octokit({
      ...(token ? { auth: token } : {}),
      request: { timeout: 10_000 },
      userAgent: "Ground-Control/0.1",
    });
  }

  private async content(
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<string | null> {
    try {
      const response = await retry(() =>
        this.octokit.rest.repos.getContent({ owner, repo, path, ref }),
      );
      return decodeContent(response.data);
    } catch (error) {
      if (githubStatus(error) === 404) return null;
      throw error;
    }
  }

  async getRepo(name: string): Promise<RepoResult<PublicRepo>> {
    const [owner, repo] = name.split("/");
    if (!owner || !repo) return { ok: false, error: { code: "not_public" } };
    try {
      const metadata = (
        await retry(() => this.octokit.rest.repos.get({ owner, repo }))
      ).data;
      if (metadata.private || metadata.archived || metadata.fork)
        return { ok: false, error: { code: "not_public" } };
      const ref = metadata.default_branch;
      const commit = (
        await retry(() =>
          this.octokit.rest.repos.getCommit({ owner, repo, ref }),
        )
      ).data;
      const readme = (
        await retry(() =>
          this.octokit.rest.repos.getReadme({ owner, repo, ref: commit.sha }),
        )
      ).data;
      if (!readme.name.toLowerCase().endsWith(".md"))
        return { ok: false, error: { code: "no_markdown_readme" } };
      const text = decodeContent(readme);
      if (text === null)
        return { ok: false, error: { code: "github_unavailable" } };
      const packageJson = await this.content(
        owner,
        repo,
        "package.json",
        commit.sha,
      );
      const readmeCommits = await retry(() =>
        this.octokit.rest.repos.listCommits({
          owner,
          repo,
          path: readme.path,
          per_page: 1,
        }),
      );
      const readmeUpdatedAt =
        readmeCommits.data[0]?.commit.committer?.date ??
        metadata.pushed_at ??
        "";
      return {
        ok: true,
        value: {
          repo: name,
          sha: commit.sha,
          stars: metadata.stargazers_count,
          language: metadata.language,
          topics: metadata.topics ?? [],
          pushedAt: metadata.pushed_at ?? "",
          readmeUpdatedAt,
          readmePath: readme.path,
          readme: text,
          packageJson,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code:
            githubStatus(error) === 404 ? "not_public" : "github_unavailable",
        },
      };
    }
  }

  async pathExists(
    name: string,
    path: string,
    sha: string,
  ): Promise<RepoResult<boolean>> {
    const [owner, repo] = name.split("/");
    if (!owner || !repo || path.includes(".."))
      return { ok: false, error: { code: "github_unavailable" } };
    try {
      const response = await retry(() =>
        this.octokit.rest.repos.getContent({ owner, repo, path, ref: sha }),
      );
      return { ok: true, value: response.status === 200 };
    } catch (error) {
      return githubStatus(error) === 404
        ? { ok: true, value: false }
        : { ok: false, error: { code: "github_unavailable" } };
    }
  }

  // GitHub's secondary rate limit rejects bursts of search calls even when
  // quota remains, so searches are spaced out rather than fired back to back.
  private async searchSlot(): Promise<void> {
    const waitMs = this.nextSearchAtMs - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    this.nextSearchAtMs = Date.now() + githubSearchIntervalMs;
  }

  async topRepos(
    language: "JavaScript" | "TypeScript",
    page: number,
  ): Promise<RepoResult<readonly RankedRepo[]>> {
    await this.searchSlot();
    try {
      const result = await retry(() =>
        this.octokit.rest.search.repos({
          q: `language:${language} fork:false archived:false`,
          sort: "stars",
          order: "desc",
          per_page: githubSearchPageSize,
          page,
        }),
      );
      return {
        ok: true,
        value: result.data.items.map((item) => ({
          repo: item.full_name,
          stars: item.stargazers_count,
        })),
      };
    } catch {
      return { ok: false, error: { code: "github_unavailable" } };
    }
  }
}

export class FixturePublicGitHub implements PublicGitHubPort {
  constructor(
    private readonly repos: ReadonlyMap<string, PublicRepo>,
    private readonly paths: ReadonlyMap<
      string,
      ReadonlySet<string>
    > = new Map(),
  ) {}
  async getRepo(repo: string): Promise<RepoResult<PublicRepo>> {
    const value = this.repos.get(repo);
    return value
      ? { ok: true, value }
      : { ok: false, error: { code: "not_public" } };
  }
  async pathExists(repo: string, path: string): Promise<RepoResult<boolean>> {
    return { ok: true, value: this.paths.get(repo)?.has(path) ?? false };
  }
  async topRepos(
    language: "JavaScript" | "TypeScript",
    page: number,
  ): Promise<RepoResult<readonly RankedRepo[]>> {
    const names = [...this.repos.values()]
      .filter((repo) => repo.language === language)
      .sort((left, right) => right.stars - left.stars)
      .map((repo) => ({ repo: repo.repo, stars: repo.stars }));
    return { ok: true, value: names.slice((page - 1) * 100, page * 100) };
  }
}
