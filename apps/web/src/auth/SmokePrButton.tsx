import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import { safeExternalUrl } from "../presentation.ts";

export function SmokePrButton({ repo }: { repo: string }) {
  const [pending, setPending] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const create = async () => {
    setPending(true);
    setFeedback("");
    const result = await api.smokePr(repo);
    setPending(false);
    if (result.ok) {
      setUrl(safeExternalUrl(result.value.url));
      return;
    }
    setFeedback(
      result.error.status === 409
        ? copy.connectSmokeSetupMissing
        : copy.connectSmokeFailed,
    );
  };
  return (
    <div className="connect-smoke-pr">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          {copy.connectSmokeOpen}
        </a>
      ) : (
        <button type="button" disabled={pending} onClick={() => void create()}>
          {pending ? copy.connectSmokePending : copy.connectSmokeCreate}
        </button>
      )}
      {feedback && <p role="status">{feedback}</p>}
    </div>
  );
}
