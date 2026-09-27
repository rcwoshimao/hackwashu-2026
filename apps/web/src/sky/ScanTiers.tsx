import { copy } from "@ground-control/copy";

export function ScanTiers() {
  const tiers = [
    [copy.scanTierStatic, copy.scanTierStaticBody],
    [copy.scanTierAi, copy.scanTierAiBody],
    [copy.scanTierDeep, copy.scanTierDeepBody],
  ] as const;
  return (
    <section
      className="scan-tiers panel"
      id="scan-tiers"
      aria-labelledby="scan-tiers-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="scan-tiers-title">{copy.scanTiersTitle}</h2>
          <p>{copy.scanTiersIntro}</p>
        </div>
      </div>
      <ol>
        {tiers.map(([name, description]) => (
          <li key={name}>
            <strong>{name}</strong>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
