import { copy } from "@ground-control/copy";
import { useState } from "react";
import { CopyCommand } from "./CopyCommand.tsx";
import { ConnectToken } from "./ConnectToken.tsx";
import { workflow } from "./workflow.ts";

const workflowUrl =
  "https://github.com/rcwoshimao/hackwashu-2026/blob/hussein/demo/orbit-app/.github/workflows/ground-control.yml";

function downloadWorkflow() {
  const url = URL.createObjectURL(new Blob([workflow], { type: "text/yaml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ground-control.yml";
  link.click();
  URL.revokeObjectURL(url);
}

export function ConnectActionSteps({
  repo,
  serverUrl,
  token,
}: {
  repo: string;
  serverUrl: string;
  token?: string;
}) {
  const [checkout, setCheckout] = useState("");
  const quotedCheckout = `'${checkout.trim().replaceAll("'", "''")}'`;
  const command = copy.connectSeedCommand
    .replace("{checkout}", quotedCheckout)
    .replace("{repo}", repo);
  return (
    <section className="connect-setup" aria-label={copy.connectStepsTitle}>
      <h2>{copy.connectStepsTitle}</h2>
      <p>{copy.connectStepsIntro}</p>
      <ol>
        <li>
          <ConnectToken token={token} serverUrl={serverUrl} repo={repo} />
        </li>
        <li>
          <h3>{copy.connectChecksTitle}</h3>
          <p>{copy.connectStepPlan}</p>
          <label htmlFor="connect-checkout">{copy.connectCheckoutLabel}</label>
          <input
            id="connect-checkout"
            value={checkout}
            onChange={(event) => setCheckout(event.target.value)}
            placeholder={copy.connectCheckoutPlaceholder}
          />
          {checkout.trim() ? (
            <CopyCommand command={command} />
          ) : (
            <p className="form-hint">{copy.connectCheckoutHint}</p>
          )}
          <p>{copy.connectStepReview}</p>
          <button type="button" onClick={downloadWorkflow}>
            {copy.connectWorkflowDownload}
          </button>
          <p className="form-hint">
            {copy.connectStepWorkflow}{" "}
            <code>.github/workflows/ground-control.yml</code>.{" "}
            <a href={workflowUrl}>{copy.connectWorkflowLink}</a>
          </p>
        </li>
        <li>
          <h3>{copy.connectVerifyTitle}</h3>
          <p>{copy.connectStepRun}</p>
        </li>
      </ol>
      <p className="form-hint">{copy.connectCommentExpectation}</p>
    </section>
  );
}
