import { copy } from "@ground-control/copy";
import { useRef, useState } from "react";
import { CopyCommand } from "./CopyCommand.tsx";

function TokenControls({ token }: { token: string }) {
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setFeedback(copy.connectTokenCopied);
    } catch {
      setRevealed(true);
      requestAnimationFrame(() => {
        input.current?.focus();
        input.current?.select();
      });
      setFeedback(copy.connectTokenCopyManual);
    }
  };
  return (
    <>
      <label htmlFor="telemetry-token">{copy.connectTokenLabel}</label>
      <div className="connect-token-row">
        <input
          id="telemetry-token"
          ref={input}
          type={revealed ? "text" : "password"}
          value={token}
          readOnly
          autoComplete="off"
        />
        <button type="button" onClick={() => void copyValue()}>
          {copy.connectTokenCopy}
        </button>
        <button type="button" onClick={() => setRevealed(!revealed)}>
          {revealed ? copy.connectTokenHide : copy.connectTokenShow}
        </button>
      </div>
      {feedback && <p role="status">{feedback}</p>}
    </>
  );
}

export function ConnectToken({
  token,
  serverUrl,
  repo,
}: {
  token?: string;
  serverUrl: string;
  repo: string;
}) {
  const [url, setUrl] = useState(serverUrl.startsWith("https://") ? serverUrl : "");
  const origin = publicHttpsOrigin(url);
  const secretCommand = copy.connectSecretCommand.replace("{repo}", repo);
  const variableCommand = origin
    ? copy.connectVariableCommand.replace("{repo}", repo).replace("{url}", origin)
    : null;
  return (
    <section className="connect-token" aria-label={copy.connectTokenTitle}>
      <h3>{copy.connectTokenTitle}</h3>
      {token ? (
        <>
          <p>{copy.connectTokenOnce}</p>
          <TokenControls token={token} />
        </>
      ) : (
        <p>{copy.connectTokenExisting}</p>
      )}
      <p>{copy.connectSecretPrompt}</p>
      <CopyCommand command={secretCommand} />
      <p>
        <a href={`https://github.com/${repo}/settings/secrets/actions`}>
          {copy.connectSecretGitHub}
        </a>
      </p>
      <label htmlFor="connect-public-url">{copy.connectPublicUrlLabel}</label>
      <input
        id="connect-public-url"
        type="url"
        value={url}
        placeholder={copy.connectPublicUrlPlaceholder}
        onChange={(event) => setUrl(event.target.value)}
      />
      <p className="form-hint">{copy.connectPublicUrlHint}</p>
      {variableCommand ? (
        <CopyCommand command={variableCommand} />
      ) : (
        <p className="form-hint">{copy.connectVariableNeedsUrl}</p>
      )}
      <p>
        <a href={`https://github.com/${repo}/settings/variables/actions`}>
          {copy.connectVariableGitHub}
        </a>
      </p>
    </section>
  );
}

export function publicHttpsOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}
