import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { AuthSession, SessionPort } from "./types.ts";

const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1_000;

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function encrypt(key: Buffer, value: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [nonce, cipher.getAuthTag(), body]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decrypt(key: Buffer, value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0))
    return null;
  const [nonce, tag, body] = parts.map((part) =>
    Buffer.from(part, "base64url"),
  );
  if (nonce === undefined || tag === undefined || body === undefined)
    return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return null;
  }
}

export class Sessions {
  private readonly key: Buffer;

  constructor(
    private readonly port: SessionPort,
    secret: string,
    private readonly now: () => number,
  ) {
    this.key = createHash("sha256").update(secret).digest();
  }

  create(login: string, oauthToken: string): string {
    const raw = randomBytes(32).toString("base64url");
    this.port.putSession({
      idHash: digest(raw),
      login,
      encryptedToken: encrypt(this.key, oauthToken),
      expiresAt: this.now() + sessionLifetimeMs,
    });
    return raw;
  }

  resolve(raw: string | undefined): AuthSession | null {
    if (raw === undefined || raw.length < 30) return null;
    const idHash = digest(raw);
    const stored = this.port.getSession(idHash);
    if (stored === null) return null;
    if (stored.expiresAt <= this.now()) {
      this.port.deleteSession(idHash);
      return null;
    }
    const oauthToken = decrypt(this.key, stored.encryptedToken);
    return oauthToken === null
      ? null
      : {
          login: stored.login,
          oauthToken,
          expiresAt: stored.expiresAt,
          sessionIdHash: idHash,
        };
  }

  remove(raw: string | undefined): void {
    if (raw !== undefined) this.port.deleteSession(digest(raw));
  }
}
