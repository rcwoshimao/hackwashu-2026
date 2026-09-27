import { createHash, randomBytes } from "node:crypto";
import type { DocFixModel } from "@ground-control/ai";
import { renderMessage } from "@ground-control/messaging";
import type { RunClaim, RunRecord } from "@ground-control/store";
import {
  deepFixMaxAddedLines,
  deepFixMaxCitationLines,
  deepFixMaxClaims,
  deepFixMaxPackageChars,
} from "../../../config/limits.ts";
import type { FixResult, GitHubFixPort } from "./types.ts";

type Target = { claim: RunClaim; path: string; start: number; end: number };
type Edit = {
  claimId: string;
  start: number;
  end: number;
  replacement: string;
  summary: string;
};
type ChangedFile = { path: string; content: string; edits: readonly Edit[] };

function citedTarget(run: RunRecord, claim: RunClaim): Target | null {
  if (!claim.deepLink) return null;
  try {
    const url = new URL(claim.deepLink);
    const prefix = `/${run.repo}/blob/${run.commitSha}/`;
    const span = /^#L(\d+)(?:-L(\d+))?$/u.exec(url.hash);
    const start = Number(span?.[1]);
    const end = Number(span?.[2] ?? span?.[1]);
    if (url.protocol !== "https:" || url.hostname !== "github.com") return null;
    if (!url.pathname.startsWith(prefix) || !start || end < start) return null;
    if (end - start > deepFixMaxCitationLines) return null;
    const path = url.pathname
      .slice(prefix.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
    if (
      path !== "README.md" &&
      !/^docs\/(?:[^/.][^/]*\/)*[^/.][^/]*\.md$/u.test(path)
    )
      return null;
    return { claim, path, start, end };
  } catch {
    return null;
  }
}

function applyEdits(content: string, edits: readonly Edit[]): string {
  const lines = content.split("\n");
  for (const edit of [...edits].sort((a, b) => b.start - a.start))
    lines.splice(
      edit.start - 1,
      edit.end - edit.start + 1,
      ...edit.replacement.split("\n"),
    );
  return lines.join("\n");
}

function withoutOverlaps(edits: readonly Edit[]): Edit[] {
  const kept: Edit[] = [];
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    if (edit.start > (kept.at(-1)?.end ?? 0)) kept.push(edit);
  }
  return kept;
}

function insideCodeFence(lines: readonly string[], line: number): boolean {
  return (
    lines.slice(0, line).filter((text) => /^\s*(?:```|~~~)/u.test(text))
      .length %
      2 ===
    1
  );
}

function branchFor(run: RunRecord, ids: readonly string[]): string {
  const hash = createHash("sha256")
    .update(`${run.id}\n${[...ids].sort().join(",")}`)
    .digest("hex")
    .slice(0, 12);
  return `groundcontrol/fix-deep-${hash}-${randomBytes(3).toString("hex")}`;
}

function confirmedTargets(run: RunRecord, ids: readonly string[]): Target[] {
  const wanted = new Set(ids.slice(0, deepFixMaxClaims));
  return run.results
    .filter(
      (claim) =>
        wanted.has(claim.claimId) &&
        claim.state === "confirmed" &&
        claim.status === "fail",
    )
    .map((claim) => citedTarget(run, claim))
    .filter((item) => item !== null);
}

export class DeepCorrection {
  constructor(private readonly model: DocFixModel) {}

  private async edit(
    target: Target,
    lines: readonly string[],
    packageJson: string | null,
    files: readonly string[],
  ): Promise<Edit | null> {
    if (target.end > lines.length) return null;
    if (insideCodeFence(lines, target.start - 1)) return null;
    const text = lines.slice(target.start - 1, target.end).join("\n");
    if (/(?:^|\n)\s*(?:```|~~~)/u.test(text)) return null;
    if (!text.includes(target.claim.quote)) return null;
    const proposed = await this.model.propose({
      path: target.path,
      finding: {
        kind: target.claim.kind,
        params: target.claim.params,
        quote: target.claim.quote,
        problem: `Deep CI check expected ${target.claim.expected}; observed ${target.claim.actual}.`,
      },
      cited: { startLine: target.start, endLine: target.end, text },
      context: {
        before: lines
          .slice(Math.max(0, target.start - 4), target.start - 1)
          .join("\n"),
        after: lines.slice(target.end, target.end + 3).join("\n"),
      },
      packageJson,
      files,
    });
    if (!proposed.ok || proposed.value === null) return null;
    const replacement = proposed.value.replacement.replace(/\n+$/u, "");
    if (
      replacement === text ||
      /(?:^|\n)\s*(?:```|~~~)/u.test(replacement) ||
      replacement.split("\n").length >
        target.end - target.start + 1 + deepFixMaxAddedLines
    )
      return null;
    return {
      claimId: target.claim.claimId,
      start: target.start,
      end: target.end,
      replacement,
      summary: proposed.value.summary,
    };
  }

  private async changedFile(
    github: GitHubFixPort,
    run: RunRecord,
    path: string,
    targets: readonly Target[],
    packageJson: string | null,
    files: readonly string[],
  ): Promise<ChangedFile | null> {
    const original = await github.readFile(run.repo, path, run.commitSha);
    if (!original.ok) return null;
    const lines = original.value.split("\n");
    const proposed = await Promise.all(
      targets.map((target) => this.edit(target, lines, packageJson, files)),
    );
    const edits = withoutOverlaps(proposed.filter((item) => item !== null));
    if (edits.length === 0) return null;
    return { path, content: applyEdits(original.value, edits), edits };
  }

  private async proposeFiles(
    github: GitHubFixPort,
    run: RunRecord,
    targets: readonly Target[],
  ): Promise<ChangedFile[]> {
    const packageFile = await github.readFile(
      run.repo,
      "package.json",
      run.commitSha,
    );
    const packageJson = packageFile.ok
      ? packageFile.value.slice(0, deepFixMaxPackageChars)
      : null;
    const listed = github.listFiles
      ? await github.listFiles(run.repo, run.commitSha)
      : null;
    const files = listed?.ok ? listed.value : [];
    const paths = [...new Set(targets.map((item) => item.path))];
    const changed = await Promise.all(
      paths.map((path) =>
        this.changedFile(
          github,
          run,
          path,
          targets.filter((item) => item.path === path),
          packageJson,
          files,
        ),
      ),
    );
    return changed.filter((item) => item !== null);
  }

  private async publish(
    github: GitHubFixPort,
    run: RunRecord,
    ready: readonly ChangedFile[],
  ): Promise<FixResult<{ url: string; fixedClaimIds: readonly string[] }>> {
    const ids = [
      ...new Set(
        ready.flatMap((file) => file.edits.map((edit) => edit.claimId)),
      ),
    ];
    const changes = ready.flatMap((file) =>
      file.edits.map(
        (edit) =>
          `- ${file.path}:${edit.start}${edit.end > edit.start ? `-${edit.end}` : ""} ${edit.summary}`,
      ),
    );
    const draft = await github.createDraft({
      repo: run.repo,
      baseSha: run.commitSha,
      ...(run.pullRequestNumber === undefined
        ? {}
        : { basePullRequestNumber: run.pullRequestNumber }),
      branch: branchFor(run, ids),
      files: ready.map((file) => ({ path: file.path, content: file.content })),
      title: renderMessage("deepFixPrTitle", { count: ids.length }),
      body: renderMessage("deepFixPrBody", {
        sha: run.commitSha.slice(0, 7),
        base: renderMessage(
          run.pullRequestNumber === undefined
            ? "deepFixBaseDefault"
            : "deepFixBasePr",
        ),
        changes: changes.join("\n"),
      }),
    });
    return draft.ok
      ? { ok: true, value: { url: draft.value.url, fixedClaimIds: ids } }
      : draft;
  }

  async fix(
    github: GitHubFixPort,
    run: RunRecord,
    claimIds: readonly string[],
  ): Promise<FixResult<{ url: string; fixedClaimIds: readonly string[] }>> {
    if (run.origin !== "ci")
      return { ok: false, error: { code: "unsupported_drift" } };
    const targets = confirmedTargets(run, claimIds);
    if (targets.length === 0)
      return { ok: false, error: { code: "uncited_change" } };
    const ready = await this.proposeFiles(github, run, targets);
    if (ready.length === 0)
      return { ok: false, error: { code: "unsupported_drift" } };
    return this.publish(github, run, ready);
  }
}
