import { copy } from "@ground-control/copy";
import { type FormEvent, useCallback, useState } from "react";
import { api, type Connection } from "../api.ts";
import type { AccountRepoData } from "../data.ts";
import { validRepo } from "../presentation.ts";
import { ConnectActionSteps } from "./ConnectActionSteps.tsx";
import { ConnectRepoPicker } from "./ConnectRepoPicker.tsx";
import { ConnectResult } from "./ConnectResult.tsx";
import { normalizeGitHubRepo } from "./connectRepo.ts";
import { useMe } from "./useMe.ts";

type Mode = "mine" | "public";
type State =
  | "idle"
  | "pending"
  | "invalid"
  | "error"
  | "visibility_changed"
  | "queued"
  | "cached"
  | "limited";
type Draft = {
  mode: Mode;
  repo: string;
  selectedMine: AccountRepoData | null;
  publicEntry: string;
  runtime: boolean;
  state: State;
  connection: Connection | null;
};
type Update = (patch: Partial<Draft>) => void;
type Fields = { draft: Draft; update: Update };

function initialDraft(): Draft {
  const params = new URLSearchParams(window.location.search);
  return {
    mode: "mine",
    repo: params.get("repo") ?? "",
    selectedMine: null,
    publicEntry: "",
    runtime: params.get("runtime") === "1",
    state: "idle",
    connection: null,
  };
}

function useConnectDraft() {
  const [draft, setDraft] = useState(initialDraft);
  const update: Update = (patch) =>
    setDraft((current) => ({ ...current, ...patch }));
  const selectMine = useCallback((selectedMine: AccountRepoData | null) => {
    setDraft((current) => ({
      ...current,
      selectedMine,
      repo: selectedMine?.repo ?? "",
      runtime: selectedMine?.repo === current.repo ? current.runtime : false,
      connection: null,
      state: "idle",
    }));
  }, []);
  const connectOwn = async (repo: string, runtime: boolean) => {
    update({ state: "pending", connection: null });
    const result = await api.connect(repo, runtime);
    update({
      connection: result.ok ? result.value : null,
      state: result.ok
        ? "idle"
        : result.error.status === 409
          ? "visibility_changed"
          : "error",
    });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const chosen =
      draft.mode === "mine"
        ? draft.repo
        : normalizeGitHubRepo(draft.publicEntry);
    if (!chosen || !validRepo(chosen)) {
      update({ state: "invalid" });
      return;
    }
    if (draft.mode === "public") {
      update({ state: "pending", connection: null });
      const scan = await api.scan(chosen);
      update({
        state: scan.ok
          ? scan.value.state
          : scan.error.status === 429
            ? "limited"
            : "error",
      });
      return;
    }
    await connectOwn(chosen.trim(), draft.runtime);
  };
  return { draft, update, selectMine, connectOwn, submit };
}

function SourceChoice({ draft, update }: Fields) {
  return (
    <fieldset className="connect-mode">
      <legend>{copy.connectChooseSource}</legend>
      {(["mine", "public"] as const).map((mode) => (
        <label key={mode}>
          <input
            type="radio"
            name="connect-source"
            checked={draft.mode === mode}
            onChange={() => update({ mode, state: "idle", connection: null })}
          />
          {mode === "mine" ? copy.connectMineOption : copy.connectPublicOption}
        </label>
      ))}
    </fieldset>
  );
}

function OwnFields({
  draft,
  onSelect,
}: {
  draft: Draft;
  onSelect: (repo: AccountRepoData | null) => void;
}) {
  return <ConnectRepoPicker value={draft.repo} onSelect={onSelect} />;
}

function PublicFields({ draft, update }: Fields) {
  return (
    <>
      <label htmlFor="connect-repo">{copy.connectPublicLabel}</label>
      <input
        id="connect-repo"
        value={draft.publicEntry}
        onChange={(event) =>
          update({
            publicEntry: event.target.value,
            connection: null,
            state: "idle",
          })
        }
        placeholder={copy.connectPublicPlaceholder}
        autoComplete="off"
      />
      <p className="form-hint">{copy.connectPublicHint}</p>
    </>
  );
}

function DeepCheckOption({ draft, update, login }: Fields & { login: string }) {
  const owned =
    draft.selectedMine?.visibility === "public" &&
    draft.selectedMine.repo.split("/")[0]?.toLowerCase() ===
      login.toLowerCase();
  if (draft.mode !== "mine" || (!owned && !draft.runtime)) return null;
  return (
    <>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={draft.runtime}
          onChange={(event) => update({ runtime: event.target.checked })}
        />
        {copy.connectRuntimeOption}
      </label>
      <p className="form-hint">{copy.connectRuntimeHint}</p>
    </>
  );
}

function ConnectOutcome({ draft, login }: { draft: Draft; login: string }) {
  const feedback = {
    idle: "",
    pending:
      draft.mode === "public" ? copy.skyScanPending : copy.connectPending,
    invalid: copy.formInvalidRepo,
    error: draft.mode === "public" ? copy.skyScanError : copy.connectFailed,
    visibility_changed: copy.connectVisibilityChanged,
    queued: copy.skyScanQueued,
    cached: copy.skyScanCached,
    limited: copy.skyScanLimit,
  }[draft.state];
  const publicRepo = normalizeGitHubRepo(draft.publicEntry);
  const scope =
    publicRepo?.split("/")[0]?.toLowerCase() === login.toLowerCase()
      ? "mine"
      : "public";
  return (
    <>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
      {draft.connection && (
        <ConnectResult
          connection={draft.connection}
          serverUrl={window.location.origin}
        />
      )}
      {draft.mode === "public" &&
        publicRepo &&
        (draft.state === "queued" || draft.state === "cached") && (
          <a
            href={`/sky?scope=${scope}&repo=${encodeURIComponent(publicRepo)}`}
          >
            {copy.connectPublicOpenSky}
          </a>
        )}
    </>
  );
}

function ConnectForm({ login }: { login: string }) {
  const { draft, update, selectMine, connectOwn, submit } = useConnectDraft();
  const setupRepo =
    draft.mode === "mine" &&
    (draft.selectedMine?.runtimeEnabled ||
      draft.selectedMine?.deepChecksSetup) &&
    !draft.connection
      ? draft.selectedMine
      : null;
  return (
    <>
      <form
        onSubmit={(event) => {
          if (setupRepo) event.preventDefault();
          else void submit(event);
        }}
      >
        <SourceChoice draft={draft} update={update} />
        {draft.mode === "mine" ? (
          <OwnFields draft={draft} onSelect={selectMine} />
        ) : (
          <PublicFields draft={draft} update={update} />
        )}
        {!setupRepo && !draft.connection?.runtimeEnabled && (
          <>
            <DeepCheckOption draft={draft} update={update} login={login} />
            <button type="submit" disabled={draft.state === "pending"}>
              {draft.mode === "public"
                ? copy.skyScanAction
                : copy.connectAction}
            </button>
          </>
        )}
      </form>
      {setupRepo && (
        <>
          <ConnectActionSteps
            repo={setupRepo.repo}
            serverUrl={window.location.origin}
            token={undefined}
          />
          <details className="disclosure connect-rotate">
            <summary>{copy.connectRotateTitle}</summary>
            <p>{copy.connectRotateHint}</p>
            <button
              type="button"
              disabled={draft.state === "pending"}
              onClick={() => void connectOwn(setupRepo.repo, true)}
            >
              {copy.connectRotateAction}
            </button>
          </details>
        </>
      )}
      <ConnectOutcome draft={draft} login={login} />
    </>
  );
}

export function ConnectPage() {
  const { me, loading, failed } = useMe();
  const deepEntry =
    new URLSearchParams(window.location.search).get("runtime") === "1";
  return (
    <main className="page form-page">
      <section className="form-panel panel">
        <a className="back-link" href="/signin">
          {copy.connectBackToRepos}
        </a>
        <h1>{deepEntry ? copy.deepScanTitle : copy.connectTitle}</h1>
        <p>{deepEntry ? copy.deepScanIntro : copy.connectIntro}</p>
        {loading ? (
          <p role="status">{copy.commonLoading}</p>
        ) : failed ? (
          <p role="alert">{copy.signInUnavailable}</p>
        ) : me?.signedIn ? (
          <ConnectForm login={me.login ?? ""} />
        ) : (
          <p>
            {copy.connectSignIn} <a href="/signin">{copy.navSignIn}</a>
          </p>
        )}
      </section>
    </main>
  );
}
