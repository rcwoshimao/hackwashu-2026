import { copy } from "@ground-control/copy";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api.ts";
import { useMe } from "../auth/useMe.ts";
import {
  type AccountRepoData,
  measuredFindings,
  type Satellite,
  type SkyData,
} from "../data.ts";
import { readableDate } from "../presentation.ts";
import { accountEventNames, watchEvents } from "../realtime.ts";
import {
  catalogEntries,
  filterEntries,
  type SkyScanFilter,
  type SkyScope,
} from "./catalog.ts";
import { ScanForm } from "./ScanForm.tsx";
import { ScanTiers } from "./ScanTiers.tsx";
import { SkyBulkScan } from "./SkyBulkScan.tsx";
import { SkyCanvas } from "./SkyCanvas.tsx";
import { SkyCatalog, SkyFilters } from "./SkyCatalog.tsx";
import { SkyInspector } from "./SkyInspector.tsx";
import { SkyLegend } from "./SkyLegend.tsx";
import { UnscannedInspector } from "./UnscannedInspector.tsx";
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

export function SkyPage() {
  const { data, state, refresh } = useSky();
  const { me, loading: accountSessionLoading } = useMe();
  const [selectedRepo, select] = useSelectedRepo();
  const [accountRepos, setAccountRepos] = useState<AccountRepoData[]>([]);
  const [accountFailed, setAccountFailed] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [scope, setScope] = useState<SkyScope>("all");
  const [scanFilter, setScanFilter] = useState<SkyScanFilter>("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (!me?.signedIn) return;
    const controller = new AbortController();
    const refreshAccounts = async () => {
      const result = await api.accountRepos(controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) setAccountRepos(result.value.repos);
      else setAccountFailed(true);
      setAccountLoading(false);
    };
    void refreshAccounts();
    const events = new EventSource("/api/events");
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refreshAccounts(), 500);
    };
    const stop = watchEvents(events, accountEventNames, schedule);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      stop();
      events.close();
    };
  }, [me?.signedIn]);
  const entries = useMemo(
    () => catalogEntries(data?.satellites ?? [], accountRepos),
    [data, accountRepos],
  );
  const filtered = useMemo(
    () => filterEntries(entries, scope, scanFilter, search),
    [entries, scope, scanFilter, search],
  );
  const scanned = filtered.flatMap((entry) =>
    entry.kind === "scanned" ? [entry.satellite] : [],
  );
  const unscanned = filtered.flatMap((entry) =>
    entry.kind !== "scanned" ? [entry.account] : [],
  );
  const selected =
    filtered.find((entry) => entry.repo === selectedRepo) ?? null;
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
      {accountFailed && (
        <p role="alert" className="state-banner">
          {copy.accountReposFailed}
        </p>
      )}
      {me?.signedIn && accountLoading && (
        <p role="status">{copy.accountReposLoading}</p>
      )}
      {data &&
        entries.length === 0 &&
        !accountSessionLoading &&
        (!me?.signedIn || !accountLoading) && (
          <div className="state-panel">
            <h2>{copy.skyEmptyTitle}</h2>
            <p>{copy.skyEmptyBody}</p>
          </div>
        )}
      {data && entries.length > 0 && (
        <>
          <SkyFilters
            scope={scope}
            status={scanFilter}
            search={search}
            onScope={setScope}
            onStatus={setScanFilter}
            onSearch={setSearch}
          />
          <ScanTiers />
          {me?.signedIn && (
            <SkyBulkScan
              repos={entries.flatMap((entry) =>
                entry.kind === "unscanned" ? [entry.account] : [],
              )}
            />
          )}
          <div className="sky-grid">
            <div className="sky-main">
              <SkyCanvas
                satellites={scanned}
                unscanned={unscanned}
                selectedRepo={selectedRepo}
                onSelect={select}
              />
              <SkyLegend />
            </div>
            <div className="sky-side">
              <SkyFindings satellites={data.satellites} />
              {selected && selected.kind !== "scanned" ? (
                <UnscannedInspector repo={selected.account} />
              ) : (
                <SkyInspector
                  satellite={
                    selected?.kind === "scanned" ? selected.satellite : null
                  }
                  account={
                    selected?.kind === "scanned" ? selected.account : null
                  }
                />
              )}
            </div>
          </div>
          <SkyCatalog
            key={`${scope}:${scanFilter}:${search}`}
            entries={filtered}
            selectedRepo={selectedRepo}
            onSelect={select}
          />
        </>
      )}
      <ScanForm />
    </main>
  );
}
