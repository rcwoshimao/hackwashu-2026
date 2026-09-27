import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import type { RepoData } from "../data.ts";
import { readableDate } from "../presentation.ts";

export function RepoScanStatus({ data }: { data: RepoData }) {
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const request = async () => {
    setRequesting(true);
    const result = await api.scan(data.repo);
    setFeedback(
      result.ok
        ? result.value.state === "cached"
          ? copy.skyScanCached
          : copy.repoScanQueued
        : copy.repoScanFailed,
    );
    setRequesting(false);
  };
  if (data.visibility === "private")
    return data.runs.length === 0 ? (
      <section className="panel repo-scan-status">
        <p>{copy.repoPrivatePending}</p>
      </section>
    ) : null;
  return (
    <section className="panel repo-scan-status">
      <div>
        <h2>{copy.repoScanTitle}</h2>
        {data.scan ? (
          <>
            <p>
              {copy.repoScanReady}: {readableDate(data.scan.scannedAt)} ·{" "}
              <span className="mono">{data.scan.commitSha.slice(0, 10)}</span>
            </p>
            <p>
              {copy.repoScanTiers}:{" "}
              {data.scan.tiersRun
                .map((tier) =>
                  tier === "ai" ? "AI" : tier === "static" ? "Static" : tier,
                )
                .join(" + ")}
            </p>
          </>
        ) : (
          <p>{copy.repoScanIntro}</p>
        )}
        {data.scan && data.label.toLowerCase() === "no telemetry" && (
          <p>{copy.repoScanLimited}</p>
        )}
        <p>
          {data.runtimeEnabled ? copy.repoDeepReady : copy.repoDeepAvailable}
        </p>
      </div>
      <button
        type="button"
        disabled={requesting}
        onClick={() => void request()}
      >
        {requesting
          ? copy.skyScanPending
          : data.scan
            ? copy.repoRescanAction
            : copy.skyScanAction}
      </button>
      {feedback && <p role="status">{feedback}</p>}
    </section>
  );
}
