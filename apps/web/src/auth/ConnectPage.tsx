import { copy } from "@ground-control/copy";
import { type FormEvent, useState } from "react";
import { api, type Connection } from "../api.ts";
import { validRepo } from "../presentation.ts";
import { ConnectResult } from "./ConnectResult.tsx";
import { IMessageLink } from "./IMessageLink.tsx";
import { useMe } from "./useMe.ts";

type State = "idle" | "pending" | "invalid" | "error" | "visibility_changed";

function ConnectForm() {
  const params = new URLSearchParams(window.location.search);
  const [repo, setRepo] = useState(params.get("repo") ?? "");
  const [runtime, setRuntime] = useState(params.get("runtime") === "1");
  const [state, setState] = useState<State>("idle");
  const [connection, setConnection] = useState<Connection | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validRepo(repo)) {
      setState("invalid");
      return;
    }
    setState("pending");
    setConnection(null);
    const result = await api.connect(repo.trim(), runtime);
    if (result.ok) setConnection(result.value);
    setState(
      result.ok
        ? "idle"
        : result.error.status === 409
          ? "visibility_changed"
          : "error",
    );
  };
  const feedback = {
    idle: "",
    pending: copy.connectPending,
    invalid: copy.formInvalidRepo,
    error: copy.connectFailed,
    visibility_changed: copy.connectVisibilityChanged,
  }[state];
  return (
    <form onSubmit={(event) => void submit(event)}>
      <label htmlFor="connect-repo">{copy.connectRepoLabel}</label>
      <input
        id="connect-repo"
        value={repo}
        onChange={(event) => {
          setRepo(event.target.value);
          setConnection(null);
          setState("idle");
        }}
        placeholder={copy.skyScanPlaceholder}
        autoComplete="off"
      />
      <p className="form-hint">{copy.formRepoHint}</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={runtime}
          onChange={(event) => setRuntime(event.target.checked)}
        />
        {copy.connectRuntimeOption}
      </label>
      <p className="form-hint">{copy.connectRuntimeHint}</p>
      <button type="submit" disabled={state === "pending"}>
        {copy.connectAction}
      </button>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
      {connection && (
        <ConnectResult
          connection={connection}
          serverUrl={window.location.origin}
        />
      )}
    </form>
  );
}

export function ConnectPage() {
  const { me, loading, failed } = useMe();
  return (
    <main className="page form-page">
      <section className="form-panel panel">
        <a className="back-link" href="/reports">
          {copy.reportsBack}
        </a>
        <h1>{copy.connectTitle}</h1>
        <p>{copy.connectIntro}</p>
        {loading ? (
          <p role="status">{copy.commonLoading}</p>
        ) : failed ? (
          <p role="alert">{copy.signInUnavailable}</p>
        ) : me?.signedIn ? (
          <>
            <ConnectForm />
            <IMessageLink />
          </>
        ) : (
          <p>
            {copy.connectSignIn} <a href="/signin">{copy.navSignIn}</a>
          </p>
        )}
      </section>
    </main>
  );
}
