import { copy } from "@ground-control/copy";
import { useRef, useState } from "react";

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
}: {
  token: string;
  serverUrl: string;
}) {
  const actionUrl = serverUrl.startsWith("https://")
    ? serverUrl
    : copy.connectPublicUrlPlaceholder;
  return (
    <section className="connect-token" aria-label={copy.connectTokenTitle}>
      <h2>{copy.connectTokenTitle}</h2>
      <p>{copy.connectTokenOnce}</p>
      <TokenControls token={token} />
      <p>
        {copy.connectTokenSecret} <code>GROUND_CONTROL_TOKEN</code>
      </p>
      <p>
        {copy.connectServerVariable} <code>GROUND_CONTROL_URL</code> ={" "}
        <code>{actionUrl}</code>
      </p>
      <p className="form-hint">{copy.connectHostedActionHint}</p>
    </section>
  );
}
