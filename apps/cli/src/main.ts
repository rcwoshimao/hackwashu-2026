#!/usr/bin/env bun
import { copy } from "../../../packages/copy/src/index.ts";
import {
  type LocalErrorCode,
  rerunSavedChecks,
  scanLocalCheckout,
} from "./local.ts";

type LocalCommand = "scan" | "check";

const errorCopy: Record<LocalErrorCode, string> = {
  private_confirmation_required: copy.localPrivateRequired,
  checkout_invalid: copy.localCheckoutInvalid,
  plan_missing: copy.localPlanMissing,
  plan_too_large: copy.localPlanTooLarge,
  plan_invalid: copy.localPlanInvalid,
  plan_unreadable: copy.localPlanUnreadable,
  no_local_docs: copy.localNoDocs,
  anthropic_key_required: copy.localAnthropicKeyRequired,
  gemini_key_required: copy.localGeminiKeyRequired,
  invalid_extraction_model: copy.localExtractionModelInvalid,
  scan_failed: copy.localScanFailed,
  run_failed: copy.localRunFailed,
};

function argumentsFor(args: string[]): {
  command: LocalCommand;
  checkout: string;
  privateExecution: boolean;
} | null {
  const [command, ...rest] = args;
  if (command !== "scan" && command !== "check") return null;
  const flags = rest.filter(
    (item) => item === "--private" || item === "--owned",
  );
  const paths = rest.filter(
    (item) => item !== "--private" && item !== "--owned",
  );
  if (
    flags.length > 1 ||
    paths.length > 1 ||
    paths.some((item) => item.startsWith("--"))
  )
    return null;
  return {
    command,
    checkout: paths[0] ?? process.cwd(),
    privateExecution: flags.length === 1,
  };
}

async function main(): Promise<void> {
  const parsed = argumentsFor(process.argv.slice(2));
  if (!parsed) {
    process.stderr.write(`${copy.localUsage}\n`);
    process.exitCode = 1;
    return;
  }
  const result =
    parsed.command === "scan"
      ? await scanLocalCheckout(parsed.checkout, parsed.privateExecution)
      : await rerunSavedChecks(parsed.checkout, parsed.privateExecution);
  if (!result.ok) {
    process.stderr.write(`${errorCopy[result.error.code]}\n`);
    process.exitCode = 1;
    return;
  }
  const run = result.value;
  process.stdout.write(
    `${JSON.stringify(
      {
        repo: run.repo,
        checkout: run.checkout,
        generated: parsed.command === "scan",
        sources: run.sources,
        counts: run.counts,
        results: run.results.map((item) => ({
          claimId: item.claimId,
          sourceId: item.sourceId,
          kind: item.kind,
          status: item.outcome.status,
        })),
      },
      null,
      2,
    )}\n`,
  );
  if (run.counts.fail > 0) process.exitCode = 2;
}

await main();
