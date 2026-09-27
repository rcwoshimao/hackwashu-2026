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
  repo,
}: {
  token: string | undefined;
  repo: string;
}) {
  return (
    <section className="connect-token" aria-label={copy.connectTokenTitle}>
      <h3>{copy.connectTokenTitle}</h3>
      {token ? (
        <>
          <p>{copy.connectTokenOnce}</p>
          <TokenControls token={token} />
          <p>{copy.connectSecretPrompt}</p>
          <CopyCommand
            command={copy.connectSecretCommand.replace("{repo}", repo)}
          />
        </>
      ) : (
        <p>{copy.connectTokenExisting}</p>
      )}
      <p>
        <a href={`https://github.com/${repo}/settings/secrets/actions`}>
          {copy.connectSecretGitHub}
        </a>
      </p>
    </section>
  );
}
