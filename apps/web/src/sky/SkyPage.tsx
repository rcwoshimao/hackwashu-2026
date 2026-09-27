import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { measuredFindings, type Satellite, type SkyData } from "../data.ts";
import { readableDate } from "../presentation.ts";
import { ScanForm } from "./ScanForm.tsx";
import { SkyCanvas } from "./SkyCanvas.tsx";
import { SkyInspector } from "./SkyInspector.tsx";
import { SkyLegend } from "./SkyLegend.tsx";
import { type SkyLoadState, useSky } from "./useSky.ts";

function useSelectedRepo(): [string | null, (repo: string) => void] {
  const [repo, setRepo] = useState(() =>
    new URLSearchParams(window.location.search).get("repo"),
  );
  useEffect(() => {
    const onPop = () =>
      setRepo(new URLSearchParams(window.location.search).get("repo"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const select = (next: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("repo", next);
    window.history.pushState(null, "", url);
    setRepo(next);
  };
  return [repo, select];
}

function SkyHeader({
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

function SkyFindings({ satellites }: { satellites: Satellite[] }) {
  const findings = measuredFindings(satellites);
  return (
    <section className="sky-findings panel" aria-label={copy.skyFindingsTitle}>
      <h2>{copy.skyFindingsTitle}</h2>
      {findings.realCount === 0 ? (
        <p>{copy.skyNoFindings}</p>
      ) : (
        <dl className="findings-grid">
          <div>
            <dt>{copy.skyRealCount}</dt>
            <dd>{findings.realCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{copy.skyDriftingCount}</dt>
            <dd
              className={findings.driftingCount > 0 ? "drift-ink" : undefined}
            >
              {findings.driftingCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>{copy.skyMedianLag}</dt>
            <dd>
              {findings.medianLagDays?.toLocaleString() ?? copy.commonNone}{" "}
              <small>{copy.skyDaysUnit}</small>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function SatelliteBrowser({
  satellites,
  selectedRepo,
  onSelect,
}: {
  satellites: Satellite[];
  selectedRepo: string | null;
  onSelect: (repo: string) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = useMemo(
    () =>
      satellites.filter((satellite) =>
        satellite.repo.toLowerCase().includes(search.toLowerCase().trim()),
      ),
    [satellites, search],
  );
  return (
    <section
      className="satellite-browser panel"
      aria-label={copy.skyBrowseTitle}
    >
      <div className="panel-heading">
        <h2>{copy.skyBrowseTitle}</h2>
        <span className="mono">{matches.length.toLocaleString()}</span>
      </div>
      <label htmlFor="satellite-search">{copy.skyBrowseSearch}</label>
      <input
        id="satellite-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={copy.skyBrowsePlaceholder}
      />
      {matches.length === 0 ? (
        <p>{copy.skyNoMatches}</p>
      ) : (
        <ul className="satellite-list">
          {matches.map((satellite) => (
            <li key={satellite.repo}>
              <button
                type="button"
                aria-pressed={selectedRepo === satellite.repo}
                onClick={() => onSelect(satellite.repo)}
              >
                <span className="repo-name">{satellite.repo}</span>
                {satellite.simulated ? (
                  <span className="simulation-tag">
                    {copy.skyModeSimulated}
                  </span>
                ) : (
                  <StatusBadge label={satellite.label} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SkyPage() {
  const { data, state, refresh } = useSky();
  const [selectedRepo, select] = useSelectedRepo();
  const satellites = useMemo(
    () => data?.satellites.slice(0, 500) ?? [],
    [data],
  );
  const selected =
    satellites.find((satellite) => satellite.repo === selectedRepo) ?? null;
  return (
    <main className="page sky-page">
      <SkyHeader data={data} state={state} refresh={refresh} />
      {state === "loading" && (
        <p className="state-panel" role="status">
          {copy.skyLoading}
        </p>
      )}
      {state === "error" && (
        <div className="state-panel">
          <p>{copy.skyDataFailed}</p>
          <button type="button" onClick={() => void refresh()}>
            {copy.commonRetry}
          </button>
        </div>
      )}
      {data && satellites.length === 0 && (
        <div className="state-panel">
          <h2>{copy.skyEmptyTitle}</h2>
          <p>{copy.skyEmptyBody}</p>
        </div>
      )}
      {data && satellites.length > 0 && (
        <>
          <div className="sky-grid">
            <div className="sky-main">
              <SkyCanvas
                satellites={satellites}
                selectedRepo={selectedRepo}
                onSelect={select}
              />
              <SkyLegend />
              {data.satellites.length > satellites.length && (
                <p className="quiet-copy">
                  {copy.skyShowing} {satellites.length.toLocaleString()}{" "}
                  {copy.skyOf} {data.satellites.length.toLocaleString()}
                </p>
              )}
            </div>
            <div className="sky-side">
              <SkyFindings satellites={data.satellites} />
              <SkyInspector satellite={selected} />
            </div>
          </div>
          <SatelliteBrowser
            satellites={satellites}
            selectedRepo={selectedRepo}
            onSelect={select}
          />
        </>
      )}
      <ScanForm />
    </main>
  );
}
