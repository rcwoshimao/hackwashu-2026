import { copy } from "@ground-control/copy";
import { publicUrl } from "./config.ts";
import { githubRepoFromPage, repoPath } from "./pages.ts";
import type { Me, PageClaims, Repo } from "./protocol.ts";

export type PopupState = {
  pageUrl: string | null;
  page: PageClaims | null;
  me: Me | null;
  repo: Repo | null;
  loading: boolean;
  busy: boolean;
  error: boolean;
  feedback: string | null;
};

export type PopupActions = {
  check: () => void;
  watch: (repo: string) => void;
  signIn: () => void;
  signOut: () => void;
  retry: () => void;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  content?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function action(
  label: string,
  run: () => void,
  disabled: boolean,
): HTMLButtonElement {
  const button = el("button", label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", run);
  return button;
}

function pageSection(state: PopupState): HTMLElement {
  const section = el("section");
  section.append(el("h2", copy.extensionPage));
  if (state.pageUrl) section.append(el("p", state.pageUrl, "page-url"));
  const message = state.loading
    ? copy.extensionLoading
    : state.error
      ? copy.extensionUnavailable
      : state.page?.known
        ? copy.extensionKnown
        : state.pageUrl
          ? copy.extensionUnknown
          : copy.extensionUnsupported;
  section.append(el("p", message, "quiet"));
  if (state.page?.known && state.page.claims.length === 0)
    section.append(el("p", copy.extensionNoClaims, "quiet"));
  if (state.page?.known && state.page.claims.length > 0)
    section.append(
      el(
        "p",
        `${copy.extensionClaimsCount}: ${state.page.claims.length.toLocaleString()}`,
        "quiet",
      ),
    );
  return section;
}

function telemetrySection(repo: Repo): HTMLElement {
  const section = el("section");
  const row = el("div", undefined, "status-row");
  row.append(el("h2", copy.extensionRepo));
  row.append(el("strong", repo.repo));
  section.append(row);
  const list = el("dl", undefined, "metric");
  list.append(el("dt", copy.extensionStatus));
  list.append(
    el(
      "dd",
      repo.label,
      repo.label.toLowerCase() === "drifting" ? "drifting" : "",
    ),
  );
  list.append(el("dt", copy.extensionDegrees));
  list.append(el("dd", `${repo.driftDegrees.toFixed(1)}°`));
  section.append(list);
  const path = repoPath(repo.repo, publicUrl);
  if (path) {
    const link = el("a", copy.extensionViewRepo);
    link.href = path;
    link.target = "_blank";
    link.rel = "noreferrer";
    section.append(link);
  }
  return section;
}

function watchControls(state: PopupState, actions: PopupActions): HTMLElement {
  const wrapper = el("div", undefined, "controls");
  const repos = state.me?.connectedRepos ?? [];
  if (repos.length === 0) {
    wrapper.append(el("p", copy.extensionNoRepos, "quiet"));
    return wrapper;
  }
  const label = el("label", copy.extensionRepo);
  label.htmlFor = "watch-repo";
  const select = el("select");
  select.id = "watch-repo";
  for (const repo of repos) {
    const option = el("option", repo);
    option.value = repo;
    select.append(option);
  }
  const button = action(
    `${copy.extensionWatch} ${select.value}`,
    () => actions.watch(select.value),
    state.busy,
  );
  select.addEventListener("change", () => {
    button.textContent = `${copy.extensionWatch} ${select.value}`;
  });
  wrapper.append(label, select, button);
  return wrapper;
}

function controlsSection(
  state: PopupState,
  actions: PopupActions,
): HTMLElement {
  const section = el("section", undefined, "controls");
  if (state.error) {
    section.append(action(copy.commonRetry, actions.retry, state.busy));
    return section;
  }
  if (!state.pageUrl || !state.page || state.loading) return section;
  const githubRepo = githubRepoFromPage(state.pageUrl);
  if (!state.page.known && state.page.canCheck && githubRepo)
    section.append(action(copy.extensionCheck, actions.check, state.busy));
  if (!state.page.known && !githubRepo && state.me?.signedIn)
    section.append(watchControls(state, actions));
  return section;
}

function accountSection(state: PopupState, actions: PopupActions): HTMLElement {
  const section = el("section", undefined, "account");
  if (state.me?.signedIn) {
    section.append(
      el("span", `${copy.extensionSignedInAs} ${state.me.login ?? ""}`),
    );
    section.append(action(copy.extensionSignOut, actions.signOut, state.busy));
  } else {
    section.append(action(copy.extensionSignIn, actions.signIn, state.busy));
  }
  return section;
}

export function renderPopup(
  target: HTMLElement,
  state: PopupState,
  actions: PopupActions,
): void {
  const wrapper = el("div", undefined, "gc-popup");
  const header = el("header");
  header.append(el("h1", copy.extensionTitle));
  header.append(el("p", copy.extensionSubtitle, "subtitle"));
  wrapper.append(header, pageSection(state));
  if (state.repo) wrapper.append(telemetrySection(state.repo));
  wrapper.append(controlsSection(state, actions));
  if (state.feedback) {
    const feedback = el("p", state.feedback, "feedback");
    feedback.setAttribute("role", "status");
    wrapper.append(feedback);
  }
  wrapper.append(accountSection(state, actions));
  target.replaceChildren(wrapper);
}
