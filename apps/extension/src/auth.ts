import { publicUrl } from "./config.ts";

export type AuthPort = {
  extensionId: string;
  redirectUrl: () => string;
  launch: (url: string) => Promise<string | undefined>;
  save: (token: string) => Promise<void>;
};

export type SignInResult =
  | { ok: true }
  | { ok: false; error: "cancelled" | "invalid" | "failed" };

export async function signIn(
  port: AuthPort,
  serverUrl: string,
): Promise<SignInResult> {
  const start = new URL("/auth/extension", serverUrl);
  start.searchParams.set("extensionId", port.extensionId);
  let finalUrl: string | undefined;
  try {
    finalUrl = await port.launch(start.toString());
  } catch {
    return { ok: false, error: "failed" };
  }
  if (!finalUrl) return { ok: false, error: "cancelled" };
  try {
    const final = new URL(finalUrl);
    const expected = new URL(port.redirectUrl());
    const token = new URLSearchParams(final.hash.slice(1)).get("token");
    if (
      final.origin !== expected.origin ||
      final.pathname !== expected.pathname
    )
      return { ok: false, error: "invalid" };
    if (!token || token.length < 20) return { ok: false, error: "invalid" };
    await port.save(token);
    return { ok: true };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

export function signInWithChrome(): Promise<SignInResult> {
  return signIn(
    {
      extensionId: chrome.runtime.id,
      redirectUrl: () => chrome.identity.getRedirectURL(),
      launch: (url) =>
        chrome.identity.launchWebAuthFlow({ url, interactive: true }),
      save: async (token) => {
        await chrome.storage.local.set({ sessionToken: token });
      },
    },
    publicUrl,
  );
}
