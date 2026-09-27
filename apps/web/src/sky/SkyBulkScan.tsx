import { copy } from "@ground-control/copy";
import { useState } from "react";
import { api } from "../api.ts";
import type { AccountRepoData } from "../data.ts";

export function SkyBulkScan({ repos }: { repos: AccountRepoData[] }) {
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    failed: number;
  } | null>(null);
  const active = progress !== null && progress.done < progress.total;
  const names = repos
    .filter(
      (repo) => repo.visibility === "public" && !repo.archived && !repo.fork,
    )
    .map((repo) => repo.repo);
  const request = async () => {
    const selected = [...names];
    let failed = 0;
    setProgress({ done: 0, total: selected.length, failed: 0 });
    for (const [index, repo] of selected.entries()) {
      const result = await api.scan(repo);
      if (!result.ok) failed += 1;
      setProgress({ done: index + 1, total: selected.length, failed });
    }
  };
  return (
    <div className="sky-bulk-scan">
      <button
        type="button"
        disabled={active || names.length === 0}
        onClick={() => void request()}
      >
        {copy.accountReposScanAll} ({names.length})
      </button>
      {progress && (
        <p role="status">
          {progress.done === progress.total
            ? copy.accountReposScanAllDone
            : copy.accountReposScanAllProgress}
          : {progress.done}/{progress.total}
          {progress.failed > 0 &&
            ` · ${copy.accountReposScanAllFailed}: ${progress.failed}`}
        </p>
      )}
    </div>
  );
}
