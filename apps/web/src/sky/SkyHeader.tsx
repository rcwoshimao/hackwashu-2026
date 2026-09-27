import { copy } from "@ground-control/copy";
import { measuredFindings, type Satellite, type SkyData } from "../data.ts";
import { readableDate } from "../presentation.ts";
import type { SkyLoadState } from "./useSky.ts";

export function SkyHeader({
  data,
  state,
  refresh,
}: {
  data: SkyData | null;
  state: SkyLoadState;
  refresh: () => Promise<void>;
}) {
  const mode = data
    ? {
        live: copy.skyModeLive,
        cached: copy.skyModeCached,
        simulated: copy.skyModeSimulated,
        empty: copy.skyModeEmpty,
      }[data.mode]
    : copy.skyModeUnavailable;
  return (
    <header className="sky-heading">
      <div>
        <p className="eyebrow">{copy.navSky}</p>
        <h1>{copy.skyTitle}</h1>
        <p>{copy.skySubtitle}</p>
      </div>
      <div className="provenance">
        <strong>{mode}</strong>
        {data && (
          <span>
            {copy.skyUpdated} {readableDate(data.updatedAt)}
          </span>
        )}
        <button
          type="button"
          className="subtle-button"
          onClick={() => void refresh()}
        >
          {copy.skyRefresh}
        </button>
      </div>
      {state === "stale" && (
        <p className="state-banner" role="status">
          {copy.skyDataStale}
        </p>
      )}
    </header>
  );
}

export function SkyFindings({ satellites }: { satellites: Satellite[] }) {
  const findings = measuredFindings(satellites);
  const reviewCount = satellites.filter(
    (item) => !item.simulated && item.label.toLowerCase() === "possible drift",
  ).length;
  return (
    <section className="sky-findings" aria-label={copy.skyFindingsTitle}>
      {findings.realCount === 0 ? (
        <p>{copy.skyNoFindings}</p>
      ) : (
        <dl className="findings-grid">
          <div>
            <dt>{copy.skyRealCount}</dt>
            <dd>{findings.realCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{copy.skyReviewCount}</dt>
            <dd className={reviewCount > 0 ? "drift-ink" : undefined}>
              {reviewCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>{copy.skyDriftingCount}</dt>
            <dd
              className={findings.driftingCount > 0 ? "drift-ink" : undefined}
            >
              {findings.driftingCount.toLocaleString()}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
