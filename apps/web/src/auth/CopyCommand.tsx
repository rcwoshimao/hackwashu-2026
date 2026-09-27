import { copy } from "@ground-control/copy";
import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [feedback, setFeedback] = useState("");
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setFeedback(copy.connectCommandCopied);
    } catch {
      setFeedback(copy.connectCommandCopyFailed);
    }
  };
  return (
    <div className="connect-command">
      <code>{command}</code>
      <button type="button" onClick={() => void copyCommand()}>
        {copy.connectCommandCopy}
      </button>
      {feedback && <span role="status">{feedback}</span>}
    </div>
  );
}
