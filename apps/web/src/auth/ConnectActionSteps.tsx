import { copy } from "@ground-control/copy";

const workflowUrl =
  "https://github.com/rcwoshimao/hackwashu-2026/blob/hussein/demo/orbit-app/.github/workflows/ground-control.yml";

export function ConnectActionSteps({ repo }: { repo: string }) {
  const command = copy.connectSeedCommand.replace("{repo}", repo);
  return (
    <section aria-label={copy.connectStepsTitle}>
      <h3>{copy.connectStepsTitle}</h3>
      <ol>
        <li>
          {copy.connectStepPlan} <code>{command}</code>
        </li>
        <li>{copy.connectStepReview}</li>
        <li>
          {copy.connectStepWorkflow} <code>{copy.connectActionRef}</code>{" "}
          <a href={workflowUrl}>{copy.connectWorkflowLink}</a>
        </li>
        <li>{copy.connectStepRun}</li>
      </ol>
      <p className="form-hint">{copy.connectCommentExpectation}</p>
    </section>
  );
}
