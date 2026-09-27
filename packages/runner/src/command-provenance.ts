import type { Claim } from "@ground-control/plan";
import type { RepositorySnapshot } from "./types.ts";

function fencedCommand(text: string, command: string): boolean {
  let marker = "";
  let width = 0;
  for (const line of text.split(/\r?\n/u)) {
    const match = /^\s*(`{3,}|~{3,})/u.exec(line);
    if (match?.[1]) {
      const fence = match[1];
      if (!marker) {
        marker = fence[0] ?? "";
        width = fence.length;
      } else if (fence[0] === marker && fence.length >= width) {
        marker = "";
        width = 0;
      }
      continue;
    }
    if (marker && line.includes(command)) return true;
  }
  return false;
}

function packageScript(snapshot: RepositorySnapshot, command: string): boolean {
  const read = snapshot.readText("package.json");
  if (!read.ok || read.value === null) return false;
  try {
    const parsed: unknown = JSON.parse(read.value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return false;
    const scripts = "scripts" in parsed ? parsed.scripts : null;
    if (
      typeof scripts !== "object" ||
      scripts === null ||
      Array.isArray(scripts)
    )
      return false;
    return Object.values(scripts).some((value) => value === command);
  } catch {
    return false;
  }
}

export function commandHasProvenance(
  claim: Claim,
  command: string,
  snapshot: RepositorySnapshot,
): boolean {
  if (packageScript(snapshot, command)) return true;
  for (const occurrence of claim.occurrences) {
    if (occurrence.location.kind !== "file") continue;
    const read = snapshot.readText(occurrence.location.path);
    if (read.ok && read.value !== null && fencedCommand(read.value, command))
      return true;
  }
  return false;
}
