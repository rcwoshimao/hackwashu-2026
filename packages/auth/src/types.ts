export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AuthError };

export type AuthError = {
  code:
    | "unconfigured"
    | "invalid_state"
    | "invalid_extension"
    | "invalid_code"
    | "github_unavailable"
    | "invalid_response";
};

export type RepoAccess = {
  visibility: "public" | "private";
  canRead: boolean;
  canAdmin: boolean;
};

export interface GitHubPort {
  authorizationUrl(
    state: string,
    challenge: string,
    redirectUri: string,
  ): Result<string>;
  exchangeCode(
    code: string,
    verifier: string,
    redirectUri: string,
  ): Promise<Result<string>>;
  currentUser(token: string): Promise<Result<{ login: string }>>;
  repoAccess(token: string, repo: string): Promise<Result<RepoAccess>>;
}

export type SessionRecord = {
  idHash: string;
  login: string;
  encryptedToken: string;
  expiresAt: number;
};

export interface SessionPort {
  getSession(idHash: string): SessionRecord | null;
  putSession(session: SessionRecord): void;
  deleteSession(idHash: string): void;
}

export type AuthSession = {
  login: string;
  oauthToken: string;
  expiresAt: number;
  sessionIdHash: string;
};
