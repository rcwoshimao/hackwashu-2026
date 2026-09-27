import { copy } from "@ground-control/copy";

export function statusView(label: string): {
  text: string;
  symbol: string;
  className: string;
} {
  switch (label.toLowerCase()) {
    case "on course":
      return {
        text: copy.statusOnCourse,
        symbol: copy.statusSymbolOnCourse,
        className: "on-course",
      };
    case "drifting":
      return {
        text: copy.statusDrifting,
        symbol: copy.statusSymbolDrifting,
        className: "drifting",
      };
    case "corrected":
      return {
        text: copy.statusCorrected,
        symbol: copy.statusSymbolCorrected,
        className: "corrected",
      };
    case "lost signal":
      return {
        text: copy.statusLostSignal,
        symbol: copy.statusSymbolLostSignal,
        className: "lost-signal",
      };
    case "no telemetry":
      return {
        text: copy.statusNoTelemetry,
        symbol: copy.statusSymbolNoTelemetry,
        className: "no-telemetry",
      };
    case "possible drift":
      return {
        text: copy.statusPossibleDrift,
        symbol: copy.statusSymbolPossibleDrift,
        className: "possible-drift",
      };
    default:
      return {
        text: copy.statusUnknown,
        symbol: copy.statusSymbolNoTelemetry,
        className: "no-telemetry",
      };
  }
}

export function readableDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? copy.commonUnknown
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function validRepo(value: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.trim());
}

export function repoPath(value: string): string {
  const [owner, name] = value.split("/");
  return `/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}`;
}

export function githubReadmeUrl(repo: string, sha: string): string {
  const [owner, name] = repo.split("/");
  return `https://github.com/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}/blob/${encodeURIComponent(sha)}/README.md`;
}

export function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
