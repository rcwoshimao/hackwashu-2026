import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import type { CheckResult, RunData } from "../data.ts";
import { safeExternalUrl } from "../presentation.ts";

export function canTriage(
  run: RunData,
  me: { signedIn: boolean; login?: string | undefined } | null,
): boolean {
  if (!me?.signedIn || !me.login || run.origin !== "public_scan") return false;
  return run.repo.split("/")[0]?.toLowerCase() === me.login.toLowerCase();
}

export function isOpenFinding(result: CheckResult): boolean {
  return result.status === "fail" && result.state !== "dropped";
}

function fixFailureText(status: number | undefined): string {
  if (status === 409) return copy.findingFixNone;
  if (status === 401 || status === 403) return copy.findingFixAccess;
  return copy.findingFixFailed;
}

export function FindingActions({
  run,
  result,
  canAct,
  onChange,
}: {
  run: RunData;
  result: CheckResult;
  canAct: boolean;
  onChange: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState<"fix" | "ignore" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [pullRequest, setPullRequest] = useState<string | null>(
    run.fixes?.[result.claimId] ?? null,
  );
  if (!canAct || !isOpenFinding(result)) return null;
  const prLink = pullRequest ? safeExternalUrl(pullRequest) : null;

  const ignore = async () => {
    setPending("ignore");
    const response = await api.drop(run.id, result.claimId);
    setPending(null);
    if (!response.ok) {
      setFeedback(copy.findingIgnoreFailed);
      return;
    }
    await onChange();
  };

  const fix = async () => {
    setPending("fix");
    setFeedback(copy.findingFixWorking);
    const response = await api.fix(run.id, [result.claimId]);
    setPending(null);
    if (!response.ok) {
      setFeedback(fixFailureText(response.error.status));
      return;
    }
    setPullRequest(response.value.pullRequestUrl);
    setFeedback("");
    await onChange();
  };

  return (
    <div className="finding-actions">
      {prLink ? (
        <a
          className="finding-pr-link"
          href={prLink}
          target="_blank"
          rel="noreferrer"
        >
          {copy.findingFixOpened}
        </a>
      ) : (
        run.fixAvailable !== false && (
          <button
            type="button"
            className="finding-fix"
            disabled={pending !== null}
            onClick={() => void fix()}
          >
            {pending === "fix" ? copy.findingFixPending : copy.findingFix}
          </button>
        )
      )}
      <button
        type="button"
        className="finding-ignore"
        disabled={pending !== null}
        onClick={() => void ignore()}
      >
        {pending === "ignore" ? copy.findingIgnorePending : copy.findingIgnore}
      </button>
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}

export function FixAllButton({
  run,
  findings,
  canAct,
  onChange,
}: {
  run: RunData;
  findings: readonly CheckResult[];
  canAct: boolean;
  onChange: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pullRequest, setPullRequest] = useState<string | null>(null);
  const unfixed = findings.filter(
    (item) => isOpenFinding(item) && !run.fixes?.[item.claimId],
  );
  if (
    !canAct ||
    run.fixAvailable === false ||
    (unfixed.length < 2 && pullRequest === null)
  )
    return null;
  const prLink = pullRequest ? safeExternalUrl(pullRequest) : null;

  const fixAll = async () => {
    setPending(true);
    setFeedback(copy.findingFixWorking);
    const response = await api.fix(
      run.id,
      unfixed.map((item) => item.claimId),
    );
    setPending(false);
    if (!response.ok) {
      setFeedback(fixFailureText(response.error.status));
      return;
    }
    setPullRequest(response.value.pullRequestUrl);
    setFeedback(
      response.value.skippedClaimIds.length > 0
        ? `${response.value.skippedClaimIds.length} ${copy.findingFixSkipped}`
        : "",
    );
    await onChange();
  };

  return (
    <div className="finding-fix-all">
      {prLink ? (
        <a
          className="finding-pr-link"
          href={prLink}
          target="_blank"
          rel="noreferrer"
        >
          {copy.findingFixOpened}
        </a>
      ) : (
        <button type="button" disabled={pending} onClick={() => void fixAll()}>
          {pending
            ? copy.findingFixPending
            : `${copy.findingFixAll} (${unfixed.length})`}
        </button>
      )}
      {feedback && (
        <p className="form-feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
