import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";

export class MessagingCipher {
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = createHash("sha256")
      .update(`ground-control-messaging\n${secret}`)
      .digest();
  }

  hash(value: string): string {
    return createHmac("sha256", this.key).update(value).digest("hex");
  }

  seal(value: string): string {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, nonce);
    const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [nonce, cipher.getAuthTag(), body]
      .map((part) => part.toString("base64url"))
      .join(".");
  }

  open(value: string): string | null {
    const parts = value.split(".");
    if (parts.length !== 3) return null;
    const [nonce, tag, body] = parts.map((part) =>
      Buffer.from(part, "base64url"),
    );
    if (!nonce || !tag || !body) return null;
    try {
      const decipher = createDecipheriv("aes-256-gcm", this.key, nonce);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(body), decipher.final()]).toString(
        "utf8",
      );
    } catch {
      return null;
    }
  }
}

export function token32(): string {
  return randomBytes(24).toString("base64url");
}
