import type { AppStore, SatelliteRecord } from "@ground-control/store";

const examples = [
  ["demo/orbit-web", 230, "web", 4, "On course", 0],
  ["demo/orbit-cli", 82, "tools", 19, "Drifting", 62],
  ["demo/orbit-service", 174, "backend", 9, "On course", 0],
] as const;

export function seedLocalDemo(store: AppStore, now: Date): void {
  if (store.listSatellites().length > 0) return;
  for (const [
    repo,
    stars,
    topicCluster,
    readmeLagDays,
    label,
    driftDegrees,
  ] of examples) {
    const satellite: SatelliteRecord = {
      repo,
      stars,
      topicCluster,
      readmeLagDays,
      label,
      driftDegrees,
      commitSha: "0000000",
      scannedAt: now.toISOString(),
      tiersRun: ["static"],
      simulated: true,
    };
    store.putSatellite(satellite);
  }
  store.setSkyMode("simulated");
}
