import { copy } from "@ground-control/copy";

export function SkyLegend() {
  return (
    <section className="sky-legend" aria-labelledby="sky-legend-title">
      <h2 id="sky-legend-title">{copy.skyLegendSummary}</h2>
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
        <p>
          <span aria-hidden="true">○</span>
          {copy.skyLegendNoChecks}
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
    </section>
  );
}
