import type { AccountRepoData, Satellite } from "../data.ts";
import { topicKey, topicKeys } from "./layout.ts";

export function selectMapSatellites(satellites: Satellite[]): Satellite[] {
  return [...satellites].sort(
    (left, right) =>
      topicKeys.indexOf(topicKey(left.topicCluster)) -
        topicKeys.indexOf(topicKey(right.topicCluster)) ||
      left.readmeLagDays - right.readmeLagDays ||
      left.repo.localeCompare(right.repo),
  );
}

export function selectMapBlimps(repos: AccountRepoData[]): AccountRepoData[] {
  return [...repos].sort((left, right) => left.repo.localeCompare(right.repo));
}
