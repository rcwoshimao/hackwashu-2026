export type Command =
  | { kind: "link"; token: string }
  | { kind: "fix" | "keep" | "ignore" | "stop" | "status" | "help" }
  | { kind: "confirm" | "drop"; claimId: string }
  | { kind: "run" | "repo"; repo: string }
  | { kind: "choose"; index: number }
  | { kind: "unknown" };

const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function githubRepo(text: string): string | null {
  const match =
    /https?:\/\/(?:www\.)?github\.com\/[^\s]+|(?:^|\s)github\.com\/[^\s]+/i.exec(
      text,
    );
  if (!match) return null;
  const raw = match[0].trim();
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com")
      return null;
    const [owner, name] = url.pathname.split("/").filter(Boolean);
    const repo = `${owner ?? ""}/${name?.replace(/\.git$/, "") ?? ""}`;
    return repoPattern.test(repo) ? repo : null;
  } catch {
    return null;
  }
}

export function parseCommand(raw: string): Command {
  const text = raw.trim();
  const link = /^LINK ([A-Za-z0-9_-]{32})$/i.exec(text);
  if (link?.[1]) return { kind: "link", token: link[1] };
  const simple = text.toLowerCase();
  if (["fix", "keep", "ignore", "stop", "status", "help"].includes(simple)) {
    return {
      kind: simple as "fix" | "keep" | "ignore" | "stop" | "status" | "help",
    };
  }
  const trust = /^(confirm|drop) (c_[0-9a-f]{10})$/i.exec(text);
  if (trust?.[1] && trust[2]) {
    return {
      kind: trust[1].toLowerCase() as "confirm" | "drop",
      claimId: trust[2].toLowerCase(),
    };
  }
  const run =
    /^(?:how do i run|run) ([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\??$/i.exec(text);
  if (run?.[1] && repoPattern.test(run[1]))
    return { kind: "run", repo: run[1] };
  const repo = githubRepo(text);
  if (repo !== null) return { kind: "repo", repo };
  if (/^[1-9][0-9]*$/.test(text))
    return { kind: "choose", index: Number(text) };
  return { kind: "unknown" };
}
