export const repoEventNames = [
  "scan_complete",
  "run",
  "trust_changed",
  "scan_fix",
  "source_added",
  "source_refresh",
  "repo_connected",
] as const;
export const accountEventNames = [
  "scan_complete",
  "run",
  "repo_connected",
] as const;

export function watchEvents(
  source: EventTarget,
  names: readonly string[],
  callback: () => void,
): () => void {
  const listener = () => callback();
  for (const name of names) source.addEventListener(name, listener);
  return () => {
    for (const name of names) source.removeEventListener(name, listener);
  };
}
