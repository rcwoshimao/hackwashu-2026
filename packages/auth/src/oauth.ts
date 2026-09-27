import { createHash, randomBytes } from "node:crypto";
import type { Sessions } from "./session.ts";
import type {
  AccountRepositories,
  AuthSession,
  GitHubPort,
  RepoAccess,
  Result,
} from "./types.ts";

const pendingLifetimeMs = 10 * 60 * 1_000;
const accessCacheMs = 10 * 60 * 1_000;
type Pending = {
  verifier: string;
  expiresAt: number;
};

export class AuthService {
  private readonly pending = new Map<string, Pending>();
  private readonly accessCache = new Map<
    string,
    { value: RepoAccess; expiresAt: number }
  >();

  constructor(
    private readonly github: GitHubPort,
    readonly sessions: Sessions,
    private readonly publicUrl: string,
    private readonly now: () => number,
  ) {}

  begin(): Result<string> {
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const redirectUri = `${this.publicUrl}/auth/github/callback`;
    const url = this.github.authorizationUrl(state, challenge, redirectUri);
    if (!url.ok) return url;
    this.pending.set(state, {
      verifier,
      expiresAt: this.now() + pendingLifetimeMs,
    });
    return url;
  }

  async complete(
    code: string,
    state: string,
  ): Promise<Result<{ token: string; login: string; redirect: string }>> {
    const pending = this.pending.get(state);
    this.pending.delete(state);
    if (pending === undefined || pending.expiresAt <= this.now()) {
      return { ok: false, error: { code: "invalid_state" } };
    }
    const redirectUri = `${this.publicUrl}/auth/github/callback`;
    const exchanged = await this.github.exchangeCode(
      code,
      pending.verifier,
      redirectUri,
    );
    if (!exchanged.ok) return exchanged;
    const user = await this.github.currentUser(exchanged.value);
    if (!user.ok) return user;
    const token = this.sessions.create(user.value.login, exchanged.value);
    const redirect = `${this.publicUrl}/signin`;
    return { ok: true, value: { token, login: user.value.login, redirect } };
  }

  session(token: string | undefined): AuthSession | null {
    return this.sessions.resolve(token);
  }

  async access(
    session: AuthSession,
    repo: string,
  ): Promise<Result<RepoAccess>> {
    const key = `${session.sessionIdHash}\n${repo.toLowerCase()}`;
    const cached = this.accessCache.get(key);
    if (cached !== undefined && cached.expiresAt > this.now()) {
      return { ok: true, value: cached.value };
    }
    const checked = await this.github.repoAccess(session.oauthToken, repo);
    if (checked.ok)
      this.accessCache.set(key, {
        value: checked.value,
        expiresAt: this.now() + accessCacheMs,
      });
    return checked;
  }

  repositories(session: AuthSession): Promise<Result<AccountRepositories>> {
    return this.github.listRepositories(session.oauthToken);
  }
}
