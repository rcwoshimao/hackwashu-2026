import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import type { RepoData, RunData } from "../data.ts";
import { readableDate } from "../presentation.ts";
import { scanErrorMessage } from "../scanFeedback.ts";
import { useScanFailure } from "../useScanFailure.ts";
import {
  type FindingSummary,
  type RepoHeadline,
  repoHeadline,
  summarizeRun,
} from "./findingSummary.ts";

type Tone = "wrong" | "maybe" | "ok" | "unknown";

type Answer = { title: string; detail: string; tone: Tone };

function counted(count: number, one: string, many: string): string {
  return count === 1 ? one : `${count} ${many}`;
}

const answers: Record<RepoHeadline, (summary: FindingSummary) => Answer> = {
  wrong: (summary) => ({
    title: counted(
      summary.confirmedFailures,
      copy.repoHeadWrongOne,
      copy.repoHeadWrongMany,
    ),
    detail: copy.repoSubWrong,
    tone: "wrong",
  }),
  maybe: (summary) => ({
    title: counted(
      summary.needsReview,
      copy.repoHeadMaybeOne,
      copy.repoHeadMaybeMany,
    ),
    detail: copy.repoSubMaybe,
    tone: "maybe",
  }),
  ok: (summary) => ({
    title: copy.repoHeadOk,
    detail: counted(summary.passed, copy.repoSubOkOne, copy.repoSubOkMany),
    tone: "ok",
  }),
  unchecked: () => ({
    title: copy.repoHeadUnchecked,
    detail: copy.repoSubUnchecked,
    tone: "unknown",
  }),
  nothing_found: () => ({
    title: copy.repoHeadNothing,
    detail: copy.repoSubNothing,
    tone: "unknown",
  }),
};

function answerFor(data: RepoData, run: RunData | null): Answer {
  if (run) {
    const summary = summarizeRun(run);
    return answers[repoHeadline(summary)](summary);
  }
  return data.visibility === "private"
    ? {
        title: copy.repoHeadNoResults,
        detail: copy.repoSubPrivate,
        tone: "unknown",
      }
    : {
        title: copy.repoHeadNotChecked,
        detail: copy.repoSubNotChecked,
        tone: "unknown",
      };
}

const marks: Record<Tone, string> = {
  wrong: copy.repoMarkWrong,
  maybe: copy.repoMarkMaybe,
  ok: copy.repoMarkOk,
  unknown: copy.repoMarkUnchecked,
};

function CheckAgain({ repo, checked }: { repo: string; checked: boolean }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  useScanFailure(requestId, () => setFeedback(copy.scanProcessingFailed));
  const request = async () => {
    setPending(true);
    const result = await api.scan(repo);
    setRequestId(result.ok ? (result.value.requestId ?? null) : null);
    setFeedback(
      result.ok
        ? result.value.state === "cached"
          ? copy.skyScanCached
          : copy.repoScanQueued
        : scanErrorMessage(result.error, copy.repoScanFailed),
    );
    setPending(false);
  };
  return (
    <>
      <button
        type="button"
        className={checked ? "button-secondary" : undefined}
        disabled={pending}
        onClick={() => void request()}
      >
        {pending
          ? copy.repoChecking
          : checked
            ? copy.repoCheckAgain
            : copy.repoCheckNow}
      </button>
      {feedback && (
        <p className="repo-answer-feedback" role="status">
          {feedback}
        </p>
      )}
    </>
  );
}

export function RepoSummary({
  data,
  run,
}: {
  data: RepoData;
  run: RunData | null;
}) {
  const answer = answerFor(data, run);
  return (
    <section className={`repo-answer tone-${answer.tone}`} id="findings">
      <span className="repo-answer-mark" aria-hidden="true">
        {marks[answer.tone]}
      </span>
      <div className="repo-answer-text">
        <h2>{answer.title}</h2>
        <p>{answer.detail}</p>
        {run && (
          <p className="repo-answer-date">
            {copy.repoCheckedOn} {readableDate(run.createdAt)}
          </p>
        )}
      </div>
      {data.visibility === "public" && (
        <div className="repo-answer-action">
          <CheckAgain repo={data.repo} checked={run !== null} />
        </div>
      )}
    </section>
  );
}
