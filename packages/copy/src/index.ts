import { cliCopy } from "./cli.ts";
import { extensionCopy } from "./extension.ts";
import { messageCopy } from "./messages.ts";
import { webCopy } from "./web.ts";

export { extensionCopy } from "./extension.ts";
export { messageCopy } from "./messages.ts";

export const copy = {
  ...cliCopy,
  ...webCopy,
  ...messageCopy,
  ...extensionCopy,
  opsUsage:
    "Usage: bun ops candidates <file>, extract <file>, seed-plan <checkout> <owner/repo>, publish-plan <owner/repo>, ping-github, ping-models, fly, or sky:scan.",
  opsFileRequired: "Provide a Markdown file to inspect.",
  opsFileUnreadable: "Could not read the requested Markdown file.",
  opsFileTooLarge: "The Markdown file exceeds the inspection limit.",
  opsUnsupported: "Unknown Ground Control command.",
} as const;

const bannedPhrases = [
  "houston",
  "seamless",
  "leverage",
  "revolutionize",
  "game-changer",
  "cutting-edge",
  "robust",
  "delve",
  "journey",
  "ai-powered",
] as const;

export function lintCopy(deck: Record<string, string>): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(deck)) {
    if (value.includes("!")) issues.push(`${key}: exclamation mark`);
    for (const phrase of bannedPhrases) {
      if (value.toLowerCase().includes(phrase))
        issues.push(`${key}: ${phrase}`);
    }
  }
  return issues;
}
