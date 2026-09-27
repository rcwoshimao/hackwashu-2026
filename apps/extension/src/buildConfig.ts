export const defaultPublicUrl =
  "https://ground-control-washu26.azurewebsites.net";

type Setting = "PUBLIC_URL";

function setting(
  name: Setting,
  localEnv: string,
  environment: Record<string, string | undefined>,
): string {
  const line = localEnv.match(
    new RegExp(`^[ \\t]*${name}[ \\t]*=[ \\t]*([^\\r\\n]*)$`, "m"),
  );
  return (environment[name]?.trim() || line?.[1]?.trim() || "").replace(
    /^(["'])(.*)\1$/,
    "$2",
  );
}

export function resolvePublicUrl(
  localEnv: string,
  environment: Record<string, string | undefined>,
): URL {
  const configured = setting("PUBLIC_URL", localEnv, environment);
  const url = new URL(configured || defaultPublicUrl);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("PUBLIC_URL must use HTTPS, or HTTP on localhost.");
  return url;
}
