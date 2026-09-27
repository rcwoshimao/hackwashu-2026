import {
  checkedOutCommit,
  metadataForCheckout,
  readActionEvent,
} from "./git-context.ts";
import { reportTelemetry } from "./report.ts";
import { trustedReportIdentity } from "./report-context.ts";
import { loadPrivateRunner, runFlightChecks } from "./run.ts";

async function main(): Promise<void> {
  const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const mode = process.env.INPUT_MODE;
  if (mode === "report") {
    if (!process.env.INPUT_SERVER || !process.env.INPUT_TOKEN) {
      process.stderr.write("missing_configuration\n");
      process.exitCode = 1;
      return;
    }
    const identity = trustedReportIdentity({
      repository: process.env.GITHUB_REPOSITORY,
      workflowSha: process.env.GITHUB_SHA,
      eventName: process.env.GITHUB_EVENT_NAME,
      event: readActionEvent(process.env.GITHUB_EVENT_PATH),
    });
    const result = await reportTelemetry(
      root,
      process.env.INPUT_SERVER ?? "",
      process.env.INPUT_TOKEN ?? "",
      identity,
    );
    if (!result.ok) {
      process.stderr.write(
        `Telemetry report failed: ${result.error}${result.status ? ` (${result.status})` : ""}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }
  if (mode !== "run") throw new TypeError("Action mode must be run or report");
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const event = readActionEvent(process.env.GITHUB_EVENT_PATH);
  const runner = await loadPrivateRunner(root, event, repo);
  if (!runner.ok) {
    process.stderr.write(`${runner.error.code}\n`);
    process.exitCode = 1;
    return;
  }
  const sha = checkedOutCommit(root);
  if (!sha || !/^[0-9a-f]{40,64}$/u.test(sha))
    throw new TypeError(
      "GitHub repository and checked-out commit are required",
    );
  const metadata = metadataForCheckout(root, event, sha);
  await runFlightChecks(root, repo, sha, runner.value, metadata);
}

await main().catch(() => {
  process.stderr.write(
    "Ground Control action failed before telemetry could be reported\n",
  );
  process.exitCode = 1;
});
