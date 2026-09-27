import { createHash, randomBytes } from "node:crypto";

export function sessionSecret(
  configured: string | undefined,
  githubClientSecret: string | undefined,
): string {
  if (configured?.trim()) return configured;
  if (githubClientSecret?.trim())
    return createHash("sha256")
      .update("ground-control/session/v1\0")
      .update(githubClientSecret)
      .digest("hex");
  return randomBytes(32).toString("hex");
}
