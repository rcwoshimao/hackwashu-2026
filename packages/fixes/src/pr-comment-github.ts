import { Octokit } from "@octokit/rest";
import type { PrCommentPort, PrCommentResult } from "./pr-comment.ts";

type OwnComment = { id: number; body: string };

function names(repo: string): { owner: string; repo: string } | null {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/u.exec(repo);
  return match ? { owner: match[1] ?? "", repo: match[2] ?? "" } : null;
}

export class OctokitPrComments implements PrCommentPort {
  private readonly client: Octokit;
  private readonly pending = new Map<string, Promise<PrCommentResult>>();

  constructor(token: string, client?: Octokit) {
    this.client =
      client ?? new Octokit({ auth: token, userAgent: "ground-control/0.1.0" });
  }

  private async findOwn(
    repo: { owner: string; repo: string },
    number: number,
    marker: string,
    login: string,
  ): Promise<OwnComment | null> {
    for (let page = 1; page <= 10; page += 1) {
      const found = await this.client.rest.issues.listComments({
        ...repo,
        issue_number: number,
        per_page: 100,
        page,
      });
      const comment = found.data.find(
        (item) =>
          item.user?.login.toLowerCase() === login &&
          item.body?.includes(marker),
      );
      if (comment) return { id: comment.id, body: comment.body ?? "" };
      if (found.data.length < 100) return null;
    }
    throw new Error("PR comment list exceeded review limit");
  }

  private async perform(
    repo: string,
    number: number,
    commitSha: string,
    marker: string,
    body: string,
  ): Promise<PrCommentResult> {
    const parsed = names(repo);
    if (
      !parsed ||
      !Number.isSafeInteger(number) ||
      number < 1 ||
      !/^[0-9a-f]{40}$/u.test(commitSha) ||
      !body.includes(marker)
    )
      return { ok: false, error: { code: "invalid_input" } };
    try {
      const pull = await this.client.rest.pulls.get({
        ...parsed,
        pull_number: number,
      });
      if (pull.data.head.sha.toLowerCase() !== commitSha)
        return { ok: false, error: { code: "invalid_input" } };
      const viewer = await this.client.rest.users.getAuthenticated();
      const own = await this.findOwn(
        parsed,
        number,
        marker,
        viewer.data.login.toLowerCase(),
      );
      if (own?.body === body) return { ok: true, value: "unchanged" };
      if (own) {
        await this.client.rest.issues.updateComment({
          ...parsed,
          comment_id: own.id,
          body,
        });
        return { ok: true, value: "updated" };
      }
      await this.client.rest.issues.createComment({
        ...parsed,
        issue_number: number,
        body,
      });
      return { ok: true, value: "created" };
    } catch {
      return { ok: false, error: { code: "github_failed" } };
    }
  }

  upsert(
    repo: string,
    number: number,
    commitSha: string,
    marker: string,
    body: string,
  ): Promise<PrCommentResult> {
    const key = `${repo}\n${number}`;
    const previous = this.pending.get(key);
    const current = () => this.perform(repo, number, commitSha, marker, body);
    const operation = (
      previous ? previous.then(current, current) : current()
    ).finally(() => {
      if (this.pending.get(key) === operation) this.pending.delete(key);
    });
    this.pending.set(key, operation);
    return operation;
  }
}

export class FakePrComments implements PrCommentPort {
  readonly comments = new Map<string, string>();
  readonly heads = new Map<string, string>();
  readonly actions: ("created" | "updated" | "unchanged")[] = [];

  async upsert(
    repo: string,
    number: number,
    commitSha: string,
    marker: string,
    body: string,
  ): Promise<PrCommentResult> {
    if (
      !Number.isSafeInteger(number) ||
      number < 1 ||
      !/^[0-9a-f]{40}$/u.test(commitSha) ||
      !body.includes(marker)
    )
      return { ok: false, error: { code: "invalid_input" } };
    const key = `${repo}\n${number}`;
    if (this.heads.get(key) !== commitSha)
      return { ok: false, error: { code: "invalid_input" } };
    const old = this.comments.get(key);
    const action =
      old === undefined ? "created" : old === body ? "unchanged" : "updated";
    this.actions.push(action);
    this.comments.set(key, body);
    return { ok: true, value: action };
  }
}
