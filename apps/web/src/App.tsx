import { copy } from "@ground-control/copy";
import { ConnectPage } from "./auth/ConnectPage.tsx";
import { SignInPage } from "./auth/SignInPage.tsx";
import { AccountMenu } from "./components/AccountMenu.tsx";
import { RepoPage } from "./repo/RepoPage.tsx";
import { ReportsPage } from "./reports/ReportsPage.tsx";
import { RunPage } from "./run/RunPage.tsx";
import { SkyPage } from "./sky/SkyPage.tsx";
import { SourcePage } from "./sources/SourcePage.tsx";

function navigation(path: string) {
  const reports =
    path === "/reports" || path === "/connect" || path === "/sources/new";
  const sky = path === "/" || path === "/sky";
  return (
    <>
      <a href="/sky" aria-current={sky ? "page" : undefined}>
        {copy.navSky}
      </a>
      <a href="/reports" aria-current={reports ? "page" : undefined}>
        {copy.navReports}
      </a>
    </>
  );
}

function route(path: string) {
  if (path === "/" || path === "/sky") return <SkyPage />;
  if (path === "/reports") return <ReportsPage />;
  if (path === "/connect") return <ConnectPage />;
  if (path === "/sources/new") return <SourcePage />;
  if (path === "/signin") return <SignInPage />;
  const repo = /^\/repos\/([^/]+)\/([^/]+)$/.exec(path);
  if (repo) {
    const owner = decodeSegment(repo[1] ?? "");
    const name = decodeSegment(repo[2] ?? "");
    if (owner && name) return <RepoPage repo={`${owner}/${name}`} />;
  }
  const run = /^\/runs\/([^/]+)$/.exec(path);
  if (run) {
    const id = decodeSegment(run[1] ?? "");
    if (id) return <RunPage id={id} />;
  }
  return (
    <main className="page state-panel">
      <h1>{copy.pageNotFound}</h1>
      <a href="/sky">{copy.navHome}</a>
    </main>
  );
}

function decodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function App() {
  const stage =
    new URLSearchParams(window.location.search).get("stage") === "1";
  const path = window.location.pathname;
  return (
    <div className={`app-shell ${stage ? "stage" : ""}`}>
      <a className="skip-link" href="#main-content">
        {copy.navSkip}
      </a>
      <div className="site-header">
        <div className="brand">
          <a href="/sky">
            <span aria-hidden="true" className="brand-mark">
              ◎
            </span>
            {copy.brand}
          </a>
          <small>{copy.appTagline}</small>
        </div>
        <div className="header-end">
          <nav className="desktop-nav" aria-label={copy.navMenu}>
            {navigation(path)}
          </nav>
          <details className="mobile-nav">
            <summary>{copy.navMenu}</summary>
            <nav aria-label={copy.navMenu}>{navigation(path)}</nav>
          </details>
          <AccountMenu />
        </div>
      </div>
      <div id="main-content">{route(path)}</div>
    </div>
  );
}
