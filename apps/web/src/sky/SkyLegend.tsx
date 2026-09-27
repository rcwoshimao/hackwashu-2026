import { copy } from "@ground-control/copy";

export function SkyLegend() {
  return (
    <details className="sky-legend">
      <summary>{copy.skyLegendSummary}</summary>
      <div className="legend-grid">
        <p>
          <span aria-hidden="true">◴</span>
          {copy.skyLegendTopic}
        </p>
        <p>
          <span aria-hidden="true">◎</span>
          {copy.skyLegendLag}
        </p>
        <p>
          <span aria-hidden="true">●</span>
          {copy.skyLegendStars}
        </p>
        <p>
          <span className="drift-ink" aria-hidden="true">
            ◖
          </span>
          {copy.skyLegendDrift}
        </p>
        <p>
          <span aria-hidden="true">◌</span>
          {copy.skyLegendHolding}
        </p>
      </div>
      <div className="topic-key">
        {[
          copy.skyTopicFrameworks,
          copy.skyTopicUi,
          copy.skyTopicBuild,
          copy.skyTopicBackend,
          copy.skyTopicOther,
        ].map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </details>
  );
}
