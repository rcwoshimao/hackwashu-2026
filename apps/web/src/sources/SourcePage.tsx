import { copy } from "@ground-control/copy";
import { type FormEvent, useState } from "react";
import { api } from "../api.ts";
import { useMe } from "../auth/useMe.ts";
import type { SourceData } from "../data.ts";
import { validRepo } from "../presentation.ts";
import { SourceSync } from "./SourceSync.tsx";

type State =
  | "idle"
  | "pending"
  | "done"
  | "invalidRepo"
  | "invalidUrl"
  | "error";

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function SourceForm({ repos }: { repos: string[] }) {
  const requested = new URLSearchParams(window.location.search).get("repo");
  const initial =
    requested && repos.includes(requested) ? requested : (repos[0] ?? "");
  const [repo, setRepo] = useState(initial);
  const [kind, setKind] = useState("confluence");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [created, setCreated] = useState<SourceData | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validRepo(repo)) {
      setState("invalidRepo");
      return;
    }
    if (!validHttpsUrl(url)) {
      setState("invalidUrl");
      return;
    }
    setState("pending");
    setCreated(null);
    const result = await api.source(repo.trim(), kind, url.trim());
    if (result.ok) setCreated(result.value);
    setState(result.ok ? "done" : "error");
  };
  const feedback = {
    idle: "",
    pending: copy.sourcePending,
    done: copy.sourceDone,
    invalidRepo: copy.formInvalidRepo,
    invalidUrl: copy.formInvalidUrl,
    error: copy.sourceFailed,
  }[state];
  return (
    <form onSubmit={(event) => void submit(event)}>
      <label htmlFor="source-repo">{copy.sourceRepoLabel}</label>
      <select
        id="source-repo"
        value={repo}
        onChange={(event) => {
          setRepo(event.target.value);
          setCreated(null);
          setState("idle");
        }}
      >
        {repos.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <label htmlFor="source-kind">{copy.sourceKindLabel}</label>
      <select
        id="source-kind"
        value={kind}
        onChange={(event) => {
          setKind(event.target.value);
          setCreated(null);
          setState("idle");
        }}
      >
        <option value="confluence">{copy.sourceKindConfluence}</option>
        <option value="url">{copy.sourceKindUrl}</option>
      </select>
      <label htmlFor="source-url">{copy.sourceUrlLabel}</label>
      <input
        id="source-url"
        type="url"
        value={url}
        onChange={(event) => {
          setUrl(event.target.value);
          setCreated(null);
          setState("idle");
        }}
        placeholder={copy.formUrlPlaceholder}
      />
      <p className="form-hint">{copy.formUrlHint}</p>
      <p className="disclosure">{copy.sourceDisclosure}</p>
      <button type="submit" disabled={state === "pending"}>
        {copy.sourceAction}
      </button>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
      {created && <SourceSync source={created} canRefresh />}
      {created && (
        <a href={`/repos/${repo.split("/").map(encodeURIComponent).join("/")}`}>
          {copy.sourceViewRepo}
        </a>
      )}
    </form>
  );
}

export function SourcePage() {
  const { me, loading, failed } = useMe();
  return (
    <main className="page form-page">
      <section className="form-panel panel">
        <a className="back-link" href="/reports">
          {copy.reportsBack}
        </a>
        <h1>{copy.sourceTitle}</h1>
        <p>{copy.sourceIntro}</p>
        {loading ? (
          <p role="status">{copy.commonLoading}</p>
        ) : failed ? (
          <p role="alert">{copy.signInUnavailable}</p>
        ) : me?.signedIn && me.connectedRepos.length > 0 ? (
          <SourceForm repos={me.connectedRepos} />
        ) : me?.signedIn ? (
          <p>
            {copy.sourceNoRepos} <a href="/connect">{copy.navConnect}</a>
          </p>
        ) : (
          <p>
            {copy.sourceSignIn} <a href="/signin">{copy.navSignIn}</a>
          </p>
        )}
      </section>
    </main>
  );
}
