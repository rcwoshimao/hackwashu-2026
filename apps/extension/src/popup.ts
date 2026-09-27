import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "../../web/src/styles/base.css";
import "./popup.css";
import { copy } from "@ground-control/copy";
import { api } from "./api.ts";
import { signInWithChrome } from "./auth.ts";
import { publicUrl } from "./config.ts";
import { githubRepoFromPage, normalizePageUrl } from "./pages.ts";
import { chromeWatch, watchPage } from "./popupActions.ts";
import {
  type PopupActions,
  type PopupState,
  renderPopup,
} from "./popupView.ts";

const target = document.querySelector<HTMLElement>("#app");
if (!target) throw new Error("Popup root is missing.");
const appRoot: HTMLElement = target;

let activeTabId: number | null = null;
let state: PopupState = {
  pageUrl: null,
  page: null,
  me: null,
  repo: null,
  loading: true,
  busy: false,
  error: false,
  feedback: null,
};

function update(patch: Partial<PopupState>): void {
  state = { ...state, ...patch };
  renderPopup(appRoot, state, actions);
}

async function load(preserveFeedback = false): Promise<void> {
  update({
    loading: true,
    error: false,
    ...(preserveFeedback ? {} : { feedback: null }),
  });
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    activeTabId = tab?.id ?? null;
    const pageUrl = normalizePageUrl(tab?.url ?? "");
    const [pageResult, meResult] = await Promise.all([
      pageUrl ? api.pageClaims(pageUrl) : Promise.resolve(null),
      api.me(),
    ]);
    const page = pageResult?.ok ? pageResult.value : null;
    const repoResult = page?.repo ? await api.repo(page.repo) : null;
    update({
      pageUrl,
      page,
      me: meResult.ok ? meResult.value : null,
      repo: repoResult?.ok ? repoResult.value : null,
      loading: false,
      busy: false,
      error: pageResult !== null && !pageResult.ok,
    });
  } catch {
    update({ loading: false, busy: false, error: true });
  }
}

async function check(): Promise<void> {
  const repo = state.pageUrl ? githubRepoFromPage(state.pageUrl) : null;
  if (!state.page?.canCheck || !repo) return;
  update({ busy: true, feedback: copy.extensionChecking });
  const result = await api.scan(repo);
  update({
    busy: false,
    feedback: result.ok ? copy.extensionCheckDone : copy.extensionCheckFailed,
  });
}

async function watch(repo: string): Promise<void> {
  if (!state.pageUrl || activeTabId === null) return;
  update({ busy: true, feedback: copy.extensionWatching });
  const result = await watchPage(
    state.pageUrl,
    repo,
    activeTabId,
    publicUrl,
    api.source,
    chromeWatch,
  );
  const feedback = result.ok
    ? result.immediate
      ? copy.extensionWatchDone
      : copy.extensionWatchReload
    : result.reason === "permission"
      ? copy.extensionPermissionDenied
      : copy.extensionWatchFailed;
  if (result.ok) await load(true);
  update({ busy: false, feedback });
}

async function signIn(): Promise<void> {
  update({ busy: true, feedback: copy.extensionSigningIn });
  const result = await signInWithChrome();
  if (result.ok) {
    await load();
    if (state.page?.known && !(await refreshMarks()))
      update({ feedback: copy.extensionMarksReload });
  } else update({ busy: false, feedback: copy.extensionSignInFailed });
}

async function signOut(): Promise<void> {
  update({ busy: true, feedback: null });
  const result = await api.signout();
  await chrome.storage.local.remove("sessionToken");
  await load();
  const refreshed = await refreshMarks();
  if (!result.ok) update({ feedback: copy.extensionSignOutFailed });
  else if (state.page?.known && !refreshed)
    update({ feedback: copy.extensionMarksReload });
}

async function refreshMarks(): Promise<boolean> {
  if (activeTabId === null) return false;
  try {
    await chrome.tabs.sendMessage(activeTabId, { kind: "refresh-claims" });
    return true;
  } catch {
    return false;
  }
}

const actions: PopupActions = {
  check: () => void check(),
  watch: (repo) => void watch(repo),
  signIn: () => void signIn(),
  signOut: () => void signOut(),
  retry: () => void load(),
};

renderPopup(appRoot, state, actions);
void load();
