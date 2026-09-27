import type { RunRecord } from "@ground-control/store";
import type { CommitStatusPort } from "./types.ts";

export class GitHubCommitStatus implements CommitStatusPort {
  constructor(
    private readonly token: string,
    private readonly publicUrl: string,
    private readonly request: (
      url: string,
      init: RequestInit,
    ) => Promise<Response> = fetch,
  ) {}

  async post(run: RunRecord): Promise<boolean> {
    if (!this.token) return false;
    const [owner, name] = run.repo.split("/");
    if (!owner || !name || !/^[0-9a-f]{7,64}$/.test(run.commitSha))
      return false;
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/statuses/${run.commitSha}`;
    const failing = run.results.filter(
      (item) => item.state === "confirmed" && item.status === "fail",
    ).length;
    const description =
      failing === 0
        ? "Ground Control: documentation checks passed"
        : `Ground Control: ${failing} confirmed documentation checks failed`;
    try {
      const response = await this.request(url, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: run.verdict,
          context: "Ground Control",
          description,
          target_url: `${this.publicUrl}/runs/${encodeURIComponent(run.id)}`,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      return response.status === 201;
    } catch {
      return false;
    }
  }
}
