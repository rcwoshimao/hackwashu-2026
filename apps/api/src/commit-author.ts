import { Octokit } from "@octokit/rest";
import type { CommitAuthorPort, CommitAuthorResult } from "./types.ts";

const repoPattern = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/u;
const shaPattern = /^[0-9a-f]{40,64}$/u;
const loginPattern = /^[A-Za-z0-9-]{1,39}$/u;

export class OctokitCommitAuthor implements CommitAuthorPort {
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

  async lookup(repo: string, commitSha: string): Promise<CommitAuthorResult> {
    const names = repoPattern.exec(repo);
    if (!names || !shaPattern.test(commitSha))
      return { ok: false, error: "github_unavailable" };
    try {
      const response = await this.client.rest.repos.getCommit({
        owner: names[1] ?? "",
        repo: names[2] ?? "",
        ref: commitSha,
      });
      const login = response.data.author?.login;
      return {
        ok: true,
        login: login && loginPattern.test(login) ? login : null,
      };
    } catch {
      return { ok: false, error: "github_unavailable" };
    }
  }
}
