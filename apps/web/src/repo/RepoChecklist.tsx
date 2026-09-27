import { copy } from "@ground-control/copy";
import type { RunData } from "../data.ts";
import { safeExternalUrl } from "../presentation.ts";
import {
  type ChecklistItem,
  type ClaimVerdict,
  checklist,
} from "./findingSummary.ts";

const shownClaims = 10;

const verdictView: Record<ClaimVerdict, { mark: string; label: string }> = {
  wrong: { mark: copy.repoMarkWrong, label: copy.repoClaimWrong },
  maybe: { mark: copy.repoMarkMaybe, label: copy.repoClaimMaybe },
  unchecked: { mark: copy.repoMarkUnchecked, label: copy.repoClaimUnchecked },
  ok: { mark: copy.repoMarkOk, label: copy.repoClaimOk },
};

function ClaimRow({ item }: { item: ChecklistItem }) {
  const { result, verdict } = item;
  const view = verdictView[verdict];
  const problem = verdict === "wrong" || verdict === "maybe";
  const link = result.deepLink ? safeExternalUrl(result.deepLink) : null;
  return (
    <li className={`repo-claim claim-${verdict}`}>
      <span className="repo-claim-mark" aria-hidden="true">
        {view.mark}
      </span>
      <div>
        <p className="repo-claim-quote">{result.quote}</p>
        <p className="repo-claim-meta">
          <span className="repo-claim-label">{view.label}</span>
          {problem && (
            <>
              {" · "}
              {result.kind === "file_exists"
                ? copy.repoReasonMissingPath
                : copy.repoReasonOther}
            </>
          )}
          {link && (
            <>
              {" · "}
              <a href={link} target="_blank" rel="noreferrer">
                {copy.repoSeeInReadme}
              </a>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

export function RepoChecklist({ run }: { run: RunData }) {
  const items = checklist(run);
  if (items.length === 0) return null;
  return (
    <section className="repo-checklist" aria-labelledby="repo-checklist-title">
      <h2 id="repo-checklist-title">{copy.repoChecklistTitle}</h2>
      <ul>
        {items.slice(0, shownClaims).map((item) => (
          <ClaimRow key={item.result.claimId} item={item} />
        ))}
      </ul>
      {items.length > shownClaims && (
        <a href={`/runs/${encodeURIComponent(run.id)}`}>
          {copy.repoSeeAllResults} ({items.length.toLocaleString()})
        </a>
      )}
    </section>
  );
}
