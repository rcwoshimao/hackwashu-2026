import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import { safeExternalUrl } from "../presentation.ts";

export function DeepFixButton({
  runId,
  claimId,
}: {
  runId: string;
  claimId: string;
}) {
  const [pending, setPending] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const fix = async () => {
    setPending(true);
    setFeedback("");
    const result = await api.deepFix(runId, claimId);
    setPending(false);
    if (result.ok) {
      setUrl(safeExternalUrl(result.value.url));
      return;
    }
    setFeedback(
      result.error.status === 409 ? copy.runDeepFixNone : copy.runDeepFixFailed,
    );
  };
  return (
    <>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          {copy.runDeepFixOpen}
        </a>
      ) : (
        <button type="button" disabled={pending} onClick={() => void fix()}>
          {pending ? copy.runDeepFixPending : copy.runDeepFixCreate}
        </button>
      )}
      {feedback && <span role="status">{feedback}</span>}
    </>
  );
}
