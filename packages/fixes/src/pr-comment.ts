import { renderMessage } from "@ground-control/messaging";
import type { AppStore, RunClaim, RunRecord } from "@ground-control/store";

export type PrCommentResult =
  | { ok: true; value: "created" | "updated" | "unchanged" | "skipped" }
  | { ok: false; error: { code: "github_failed" | "invalid_input" } };

export interface PrCommentPort {
  upsert(
    repo: string,
    number: number,
    commitSha: string,
    marker: string,
    body: string,
  ): Promise<PrCommentResult>;
}

export const prEvidenceMarker = "<!-- ground-control:evidence -->";

function tableText(value: string): string {
  return value
    .replace(/[\r\n]+/gu, " ")
    .replace(/[|<>[\]]/gu, (character) => `\\${character}`)
    .slice(0, 240);
}

function safeEvidenceLink(
  run: RunRecord,
  claim: RunClaim,
  publicUrl: string,
): string {
  const fallback = `${publicUrl}/runs/${encodeURIComponent(run.id)}`;
  if (!claim.deepLink) return fallback;
  try {
    const parsed = new URL(claim.deepLink);
    return parsed.protocol === "https:" &&
      parsed.hostname === "github.com" &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname.startsWith(`/${run.repo}/blob/${run.commitSha}/`)
      ? parsed.href
      : fallback;
  } catch {
    return fallback;
  }
}

function evidenceBody(
  store: AppStore,
  run: RunRecord,
  claims: readonly RunClaim[],
  publicUrl: string,
): string {
  const lines = [
    prEvidenceMarker,
    renderMessage("prEvidenceLead", {
      count: claims.length,
      sha: run.commitSha.slice(0, 7),
    }),
    "",
    renderMessage("prEvidenceHeading"),
  ];
  for (const claim of claims.slice(0, 30))
    lines.push(
      renderMessage("prEvidenceRow", {
        source: tableText(
          store.getSource(claim.sourceId)?.title ?? claim.sourceId,
        ),
        quote: tableText(claim.quote),
        expected: tableText(claim.expected),
        actual: tableText(claim.actual),
        url: safeEvidenceLink(run, claim, publicUrl),
      }),
    );
  lines.push("", renderMessage("prEvidenceFooter"));
  return lines.join("\n");
}

export async function commentOnConfirmedDrift(
  store: AppStore,
  run: RunRecord,
  pullRequestNumber: number,
  publicUrl: string,
  port: PrCommentPort,
): Promise<PrCommentResult> {
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber < 1)
    return { ok: false, error: { code: "invalid_input" } };
  if (store.getRepo(run.repo)?.connected !== true)
    return { ok: true, value: "skipped" };
  const claims = run.results
    .filter((claim) => claim.state === "confirmed" && claim.status === "fail")
    .sort(
      (a, b) =>
        a.sourceId.localeCompare(b.sourceId) ||
        a.claimId.localeCompare(b.claimId),
    );
  if (claims.length === 0) return { ok: true, value: "skipped" };
  return port.upsert(
    run.repo,
    pullRequestNumber,
    run.commitSha,
    prEvidenceMarker,
    evidenceBody(store, run, claims, publicUrl),
  );
}
