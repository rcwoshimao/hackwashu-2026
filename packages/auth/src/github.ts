import { z } from "zod";
import type { GitHubPort, RepoAccess, Result } from "./types.ts";

const requestTimeoutMs = 8_000;
const retryDelayMs = 200;
const repoPattern = /^[^/\s]+\/[^/\s]+$/;
const tokenSchema = z.object({ access_token: z.string().min(1) });
const userSchema = z.object({ login: z.string().min(1) });
const repoSchema = z.object({
  private: z.boolean(),
  permissions: z.object({ admin: z.boolean().optional() }).optional(),
});

type JsonResponse = { status: number; body: unknown };

export class GitHubHttp implements GitHubPort {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly request: (
      url: string,
      init: RequestInit,
    ) => Promise<Response> = fetch,
  ) {}

  authorizationUrl(
    state: string,
    challenge: string,
    redirectUri: string,
  ): Result<string> {
    if (!this.clientId || !this.clientSecret)
      return { ok: false, error: { code: "unconfigured" } };
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "repo read:user");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return { ok: true, value: url.toString() };
  }

  private async json(
    url: string,
    init: RequestInit,
  ): Promise<Result<JsonResponse>> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.request(url, {
          ...init,
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt === 0
        ) {
          await Bun.sleep(retryDelayMs);
          continue;
        }
        return {
          ok: true,
          value: {
            status: response.status,
            body: (await response.json()) as unknown,
          },
        };
      } catch {
        if (attempt === 0) {
          await Bun.sleep(retryDelayMs);
        }
      }
    }
    return { ok: false, error: { code: "github_unavailable" } };
  }

  async exchangeCode(
    code: string,
    verifier: string,
    redirectUri: string,
  ): Promise<Result<string>> {
    if (!this.clientId || !this.clientSecret)
      return { ok: false, error: { code: "unconfigured" } };
    const response = await this.json(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier,
        }),
      },
    );
    if (!response.ok) return response;
    if (response.value.status !== 200)
      return { ok: false, error: { code: "invalid_code" } };
    const parsed = tokenSchema.safeParse(response.value.body);
    return parsed.success
      ? { ok: true, value: parsed.data.access_token }
      : { ok: false, error: { code: "invalid_code" } };
  }

  async currentUser(token: string): Promise<Result<{ login: string }>> {
    const response = await this.json("https://api.github.com/user", {
      headers: this.headers(token),
    });
    if (!response.ok) return response;
    const parsed = userSchema.safeParse(response.value.body);
    return response.value.status === 200 && parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, error: { code: "invalid_response" } };
  }

  async repoAccess(token: string, repo: string): Promise<Result<RepoAccess>> {
    if (!repoPattern.test(repo))
      return { ok: false, error: { code: "invalid_response" } };
    const [owner, name] = repo.split("/");
    const url = `https://api.github.com/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}`;
    const response = await this.json(url, { headers: this.headers(token) });
    if (!response.ok) return response;
    if (response.value.status === 403 || response.value.status === 404) {
      return {
        ok: true,
        value: { visibility: "private", canRead: false, canAdmin: false },
      };
    }
    const parsed = repoSchema.safeParse(response.value.body);
    if (response.value.status !== 200 || !parsed.success) {
      return { ok: false, error: { code: "invalid_response" } };
    }
    return {
      ok: true,
      value: {
        visibility: parsed.data.private ? "private" : "public",
        canRead: true,
        canAdmin: parsed.data.permissions?.admin === true,
      },
    };
  }

  private headers(token: string): Record<string, string> {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    };
  }
}
