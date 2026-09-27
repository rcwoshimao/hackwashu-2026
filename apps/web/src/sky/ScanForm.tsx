import { copy } from "@ground-control/copy";
import { type FormEvent, useState } from "react";
import { api } from "../api.ts";
import { repoFromInput, repoPath } from "../presentation.ts";

type State =
  | "idle"
  | "pending"
  | "done"
  | "cached"
  | "invalid"
  | "limited"
  | "error";

export function ScanForm() {
  const [repo, setRepo] = useState("");
  const [state, setState] = useState<State>("idle");
  const [checked, setChecked] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = repoFromInput(repo);
    if (!parsed) {
      setState("invalid");
      return;
    }
    setState("pending");
    setChecked(null);
    const result = await api.scan(parsed);
    if (result.ok) setChecked(parsed);
    setState(
      result.ok
        ? result.value.state === "cached"
          ? "cached"
          : "done"
        : result.error.status === 429
          ? "limited"
          : "error",
    );
  };
  const feedback = {
    idle: "",
    pending: copy.skyScanPending,
    done: copy.skyScanQueued,
    cached: copy.skyScanCached,
    invalid: copy.formInvalidRepo,
    limited: copy.skyScanLimit,
    error: copy.skyScanError,
  }[state];
  return (
    <form className="scan-form" onSubmit={(event) => void submit(event)}>
      <div>
        <h2>{copy.skyScanTitle}</h2>
        <p>{copy.skyScanPrivacy}</p>
      </div>
      <label htmlFor="scan-repo">{copy.skyScanLabel}</label>
      <div className="inline-fields">
        <input
          id="scan-repo"
          value={repo}
          onChange={(event) => setRepo(event.target.value)}
          placeholder={copy.skyScanPlaceholder}
          autoComplete="off"
        />
        <button type="submit" disabled={state === "pending"}>
          {copy.skyScanAction}
        </button>
      </div>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}{" "}
          {checked && (
            <a href={repoPath(checked)}>
              {copy.skyScanSeeResult} {checked}
            </a>
          )}
        </p>
      )}
    </form>
  );
}
