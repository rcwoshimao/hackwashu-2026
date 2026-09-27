import { copy } from "@ground-control/copy";

export function ScanTiers() {
  const tiers = [
    [copy.scanTierStatic, copy.scanTierStaticBody],
    [copy.scanTierAi, copy.scanTierAiBody],
    [copy.scanTierDeep, copy.scanTierDeepBody],
  ] as const;
  return (
    <details className="scan-tiers panel" id="scan-tiers">
      <summary>{copy.scanTiersSummary}</summary>
      <p>{copy.scanTiersIntro}</p>
      <ol>
        {tiers.map(([name, description]) => (
          <li key={name}>
            <strong>{name}</strong>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
