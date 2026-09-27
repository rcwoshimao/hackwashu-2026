import { copy } from "@ground-control/copy";
import { useMe } from "../auth/useMe.ts";
import type { RunData } from "../data.ts";
import { safeExternalUrl } from "../presentation.ts";
import { canTriage, FindingActions, FixAllButton } from "./FindingActions.tsx";
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

function ClaimRow({
  item,
  run,
  canAct,
  onChange,
}: {
  item: ChecklistItem;
  run: RunData;
  canAct: boolean;
  onChange: () => Promise<void>;
}) {
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
        <FindingActions
          run={run}
          result={result}
          canAct={canAct}
          onChange={onChange}
        />
      </div>
    </li>
  );
}

export function RepoChecklist({
  run,
  onChange,
}: {
  run: RunData;
  onChange: () => Promise<void>;
}) {
  const { me } = useMe();
  const canAct = canTriage(run, me);
  const items = checklist(run);
  if (items.length === 0) return null;
  return (
    <section className="repo-checklist" aria-labelledby="repo-checklist-title">
      <h2 id="repo-checklist-title">{copy.repoChecklistTitle}</h2>
      <FixAllButton
        run={run}
        findings={run.results}
        canAct={canAct}
        onChange={onChange}
      />
      <ul>
        {items.slice(0, shownClaims).map((item) => (
          <ClaimRow
            key={item.result.claimId}
            item={item}
            run={run}
            canAct={canAct}
            onChange={onChange}
          />
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
