import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";

export function WorkflowInstallButton({
  repo,
  branch,
}: {
  repo: string;
  branch: string;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const install = async () => {
    setPending(true);
    setFeedback("");
    const result = await api.installWorkflow(repo, branch.trim());
    setPending(false);
    setFeedback(
      result.ok
        ? result.value.created
          ? copy.connectWorkflowInstalled
          : copy.connectWorkflowAlreadyExists
        : copy.connectWorkflowInstallFailed,
    );
  };

  return (
    <div className="connect-workflow-install">
      <button
        type="button"
        disabled={pending || !branch.trim()}
        onClick={() => void install()}
      >
        {pending ? copy.connectWorkflowInstalling : copy.connectWorkflowInstall}
      </button>
      <p className="form-hint">{copy.connectWorkflowInstallHint}</p>
      {feedback && <p role="status">{feedback}</p>}
    </div>
  );
}
