import { copy } from "@ground-control/copy";
import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge.tsx";
import type { SkyEntry, SkyScanFilter, SkyScope } from "./catalog.ts";

const rowsPerPage = 20;

type Props = {
  entries: SkyEntry[];
  selectedRepo: string | null;
  onSelect: (repo: string) => void;
};

type FilterProps = {
  scope: SkyScope;
  status: SkyScanFilter;
  search: string;
  onScope: (value: SkyScope) => void;
  onStatus: (value: SkyScanFilter) => void;
  onSearch: (value: string) => void;
};

export function SkyFilters(props: FilterProps) {
  return (
    <div className="sky-catalog-controls">
      <div>
        <label htmlFor="sky-scope">{copy.skyScopeLabel}</label>
        <select
          id="sky-scope"
          value={props.scope}
          onChange={(event) => {
            props.onScope(event.target.value as SkyScope);
          }}
        >
          <option value="all">{copy.skyScopeAll}</option>
          <option value="mine">{copy.skyScopeMine}</option>
          <option value="public">{copy.skyScopePublic}</option>
          <option value="private">{copy.skyScopePrivate}</option>
        </select>
      </div>
      <div>
        <label htmlFor="sky-scan-filter">{copy.skyScanFilterLabel}</label>
        <select
          id="sky-scan-filter"
          value={props.status}
          onChange={(event) => {
            props.onStatus(event.target.value as SkyScanFilter);
          }}
        >
          <option value="all">{copy.skyScanFilterAll}</option>
          <option value="scanned">{copy.skyScanFilterScanned}</option>
          <option value="unscanned">{copy.skyScanFilterUnscanned}</option>
        </select>
      </div>
      <div>
        <label htmlFor="satellite-search">{copy.skyBrowseSearch}</label>
        <input
          id="satellite-search"
          value={props.search}
          onChange={(event) => {
            props.onSearch(event.target.value);
          }}
          placeholder={copy.skyBrowsePlaceholder}
        />
      </div>
    </div>
  );
}

export function SkyCatalog(props: Props) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(props.entries.length / rowsPerPage));
  const currentPage = Math.min(page, pages);
  const shown = props.entries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  return (
    <section
      className="satellite-browser panel"
      aria-label={copy.skyBrowseTitle}
    >
      <div className="panel-heading">
        <h2>{copy.skyBrowseTitle}</h2>
        <span className="mono">{props.entries.length.toLocaleString()}</span>
      </div>
      {shown.length === 0 ? (
        <p>{copy.skyNoMatches}</p>
      ) : (
        <ul className="satellite-list">
          {shown.map((entry) => (
            <li key={entry.repo}>
              <button
                type="button"
                aria-pressed={props.selectedRepo === entry.repo}
                onClick={() => props.onSelect(entry.repo)}
              >
                <span className="repo-name">{entry.repo}</span>
                {entry.kind === "scanned" ? (
                  <StatusBadge label={entry.satellite.label} />
                ) : entry.kind === "checked" ? (
                  <StatusBadge
                    label={entry.account.label ?? copy.statusNoTelemetry}
                  />
                ) : (
                  <span className="simulation-tag">{copy.skyUnscannedTag}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {props.entries.length > rowsPerPage && (
        <nav className="sky-catalog-pages" aria-label={copy.skyBrowseTitle}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            {copy.skyListPrevious}
          </button>
          <span className="mono">
            {copy.skyListPage} {currentPage} {copy.accountReposPageOf} {pages}
          </span>
          <button
            type="button"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {copy.skyListNext}
          </button>
        </nav>
      )}
    </section>
  );
}
