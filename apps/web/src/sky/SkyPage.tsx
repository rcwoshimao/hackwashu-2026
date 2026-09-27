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
import { catalogEntries, filterEntries, type SkyScope } from "./catalog.ts";
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

export function SkyPage() {
  const { data, state, refresh } = useSky();
  const { me, loading: accountSessionLoading } = useMe();
  const [selectedRepo, select] = useSelectedRepo();
  const [accountRepos, setAccountRepos] = useState<AccountRepoData[]>([]);
  const [accountFailed, setAccountFailed] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [scope, setScope] = useState<SkyScope>("public");
  const [search, setSearch] = useState("");
  const explicitPublicScope =
    new URLSearchParams(window.location.search).get("scope") === "public";
  useEffect(() => {
    if (me?.signedIn && !explicitPublicScope) setScope("mine");
  }, [me?.signedIn, explicitPublicScope]);
  const changeScope = (next: SkyScope) => {
    const url = new URL(window.location.href);
    url.searchParams.set("scope", next);
    window.history.replaceState(null, "", url);
    setScope(next);
  };
  const inspect = (repo: string) => {
    select(repo);
    if (window.matchMedia("(max-width: 1050px)").matches) {
      window.requestAnimationFrame(() =>
        document.getElementById("selected-repo-panel")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        }),
      );
    }
  };
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
    () => filterEntries(entries, scope, search, me?.login ?? null),
    [entries, scope, search, me?.login],
  );
  const scanned = filtered.flatMap((entry) =>
    entry.kind === "scanned" ? [entry.satellite] : [],
  );
  const unscanned = filtered.flatMap((entry) =>
    entry.kind !== "scanned" ? [entry.account] : [],
  );
  const selected =
    filtered.find((entry) => entry.repo === selectedRepo) ?? null;
  const canEnableDeep = Boolean(
    selected?.account?.visibility === "public" &&
      selected.account.canAdmin &&
      !selected.account.runtimeEnabled &&
      me?.login &&
      selected.repo.split("/")[0]?.toLowerCase() === me.login.toLowerCase(),
  );
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
            search={search}
            onScope={changeScope}
            onSearch={setSearch}
          />
          <p className="sky-scope-hint">
            {scope === "mine" ? copy.skyScopeMineHint : copy.skyScopePublicHint}
          </p>
          {scope === "mine" && !me?.signedIn ? (
            <div className="state-panel panel">
              <p>{copy.skyMyReposSignIn}</p>
              <a className="button" href="/signin">
                {copy.navSignIn}
              </a>
            </div>
          ) : (
            <>
              <SkyFindings satellites={scanned} />
              <div className="sky-grid">
                <div className="sky-main">
                  <SkyCanvas
                    satellites={scanned}
                    unscanned={unscanned}
                    selectedRepo={selectedRepo}
                    onSelect={inspect}
                  />
                  <SkyLegend />
                </div>
                <div className="sky-side">
                  {selected && selected.kind !== "scanned" ? (
                    <UnscannedInspector
                      repo={selected.account}
                      canEnableDeep={canEnableDeep}
                    />
                  ) : (
                    <SkyInspector
                      satellite={
                        selected?.kind === "scanned" ? selected.satellite : null
                      }
                      account={
                        selected?.kind === "scanned" ? selected.account : null
                      }
                      canEnableDeep={canEnableDeep}
                    />
                  )}
                </div>
              </div>
              <SkyCatalog
                key={`${scope}:${search}`}
                entries={filtered}
                selectedRepo={selectedRepo}
                onSelect={inspect}
              />
              {scope === "mine" && me?.signedIn && (
                <SkyBulkScan
                  repos={entries.flatMap((entry) =>
                    entry.kind === "unscanned" ? [entry.account] : [],
                  )}
                />
              )}
              <div className="sky-help">
                <ScanTiers />
              </div>
            </>
          )}
        </>
      )}
      {scope === "public" && <ScanForm />}
    </main>
  );
}
