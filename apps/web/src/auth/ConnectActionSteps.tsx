import { copy } from "@ground-control/copy";
import { useState } from "react";
import { ConnectToken } from "./ConnectToken.tsx";
import { CopyCommand } from "./CopyCommand.tsx";
import { SmokePrButton } from "./SmokePrButton.tsx";
import { publicHttpsOrigin, workflowForBranch } from "./workflow.ts";

function downloadWorkflow(branch: string, serverUrl: string) {
  const source = workflowForBranch(branch, serverUrl);
  const url = URL.createObjectURL(new Blob([source], { type: "text/yaml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ground-control.yml";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function WorkflowDownload({ serverUrl }: { serverUrl: string }) {
  const [branch, setBranch] = useState("main");
  const publicUrl = publicHttpsOrigin(serverUrl);
  return (
    <>
      <label htmlFor="connect-default-branch">
        {copy.connectDefaultBranchLabel}
      </label>
      <input
        id="connect-default-branch"
        value={branch}
        onChange={(event) => setBranch(event.target.value)}
      />
      {publicUrl ? (
        <>
          <p className="form-hint">
            {copy.connectHostedUrl} <code>{publicUrl}</code>
          </p>
          <button
            type="button"
            disabled={!branch.trim()}
            onClick={() => downloadWorkflow(branch.trim(), publicUrl)}
          >
            {copy.connectWorkflowDownload}
          </button>
        </>
      ) : (
        <p className="form-hint">{copy.connectHostedUrlMissing}</p>
      )}
      <p className="form-hint">
        {copy.connectStepWorkflow}{" "}
        <code>.github/workflows/ground-control.yml</code>.{" "}
      </p>
    </>
  );
}

export function ConnectActionSteps({
  repo,
  serverUrl,
  token,
}: {
  repo: string;
  serverUrl: string;
  token: string | undefined;
}) {
  return (
    <section className="connect-setup" aria-label={copy.connectStepsTitle}>
      <h2>{copy.connectStepsTitle}</h2>
      <p>{copy.connectStepsIntro}</p>
      <ol>
        <li>
          <ConnectToken token={token} repo={repo} />
        </li>
        <li>
          <h3>{copy.connectChecksTitle}</h3>
          <p>{copy.connectStepPlan}</p>
          <WorkflowDownload serverUrl={serverUrl} />
        </li>
        <li>
          <h3>{copy.connectVerifyTitle}</h3>
          <p>{copy.connectStepRun}</p>
          <SmokePrButton repo={repo} />
          <p className="form-hint">{copy.connectSmokeFallback}</p>
          <CopyCommand
            command={copy.connectSmokeCommand.replace(
              "{repo}",
              repo.replaceAll("'", "''"),
            )}
          />
        </li>
      </ol>
      <p className="form-hint">{copy.connectCommentExpectation}</p>
    </section>
  );
}
