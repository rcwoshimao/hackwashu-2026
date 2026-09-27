import type { AccountRepoData, Satellite } from "../data.ts";
import { topicKey, topicKeys } from "./layout.ts";

function byLag(left: Satellite, right: Satellite): number {
  return (
    left.readmeLagDays - right.readmeLagDays ||
    left.repo.localeCompare(right.repo)
  );
}

function candidates(items: Satellite[]): Satellite[] {
  const lag = [...items].sort(byLag);
  const stars = [...items].sort(
    (left, right) =>
      right.stars - left.stars || left.repo.localeCompare(right.repo),
  );
  const review = [...items]
    .filter((item) =>
      ["drifting", "possible drift"].includes(item.label.toLowerCase()),
    )
    .sort(
      (left, right) =>
        right.driftDegrees - left.driftDegrees ||
        right.stars - left.stars ||
        left.repo.localeCompare(right.repo),
    );
  return [review[0], lag[0], lag.at(-1), ...stars].filter(
    (item): item is Satellite => item !== undefined,
  );
}

export function selectMapSatellites(
  satellites: Satellite[],
  selectedRepo: string | null,
  perTopic: number,
): Satellite[] {
  if (perTopic <= 0) return [];
  const selected: Satellite[] = [];
  for (const topic of topicKeys) {
    const items = satellites.filter(
      (item) => topicKey(item.topicCluster) === topic,
    );
    const chosen = new Map<string, Satellite>();
    for (const item of candidates(items)) {
      if (chosen.size >= perTopic) break;
      chosen.set(item.repo, item);
    }
    const focused = items.find((item) => item.repo === selectedRepo);
    if (focused && !chosen.has(focused.repo)) {
      if (chosen.size >= perTopic)
        chosen.delete([...chosen.keys()].at(-1) ?? "");
      chosen.set(focused.repo, focused);
    }
    selected.push(...[...chosen.values()].sort(byLag));
  }
  return selected;
}

export function selectMapBlimps(
  repos: AccountRepoData[],
  selectedRepo: string | null,
  limit: number,
): AccountRepoData[] {
  if (limit <= 0) return [];
  const sorted = [...repos].sort((left, right) =>
    left.repo.localeCompare(right.repo),
  );
  if (sorted.length <= limit) return sorted;
  const chosen = Array.from(
    { length: limit },
    (_, index) => sorted[Math.floor(((index + 0.5) * sorted.length) / limit)],
  ).filter((item): item is AccountRepoData => item !== undefined);
  const focused = sorted.find((item) => item.repo === selectedRepo);
  if (focused && !chosen.some((item) => item.repo === focused.repo))
    chosen[chosen.length - 1] = focused;
  return chosen.sort((left, right) => left.repo.localeCompare(right.repo));
}
