type Setting = "PUBLIC_URL" | "GROUND_CONTROL_PORT";

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
  const port = setting("GROUND_CONTROL_PORT", localEnv, environment) || "8787";
  if (
    !configured &&
    (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  )
    throw new Error("GROUND_CONTROL_PORT must be a valid TCP port.");
  const url = new URL(configured || `http://localhost:${port}`);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("PUBLIC_URL must use HTTPS, or HTTP on localhost.");
  return url;
}
