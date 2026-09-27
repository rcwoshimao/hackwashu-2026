import { createHash, randomBytes } from "node:crypto";
import type { DocFixModel } from "@ground-control/ai";
import { renderMessage } from "@ground-control/messaging";
import type { RunClaim, RunRecord } from "@ground-control/store";
import type { FixResult, GitHubFixPort } from "./types.ts";

export type ScanFixOutcome = {
  pullRequestUrl: string;
  commitSha: string;
  fixedClaimIds: readonly string[];
  skippedClaimIds: readonly string[];
};

type Target = {
  claim: RunClaim;
  path: string;
  startLine: number;
  endLine: number;
};

type Edit = {
  claimId: string;
  startLine: number;
  endLine: number;
  replacement: string;
  summary: string;
};

const contextLines = 3;
const maxFiles = 400;

function citation(run: RunRecord, claim: RunClaim): Target | null {
  if (!claim.deepLink) return null;
  try {
    const url = new URL(claim.deepLink);
    const prefix = `/${run.repo}/blob/${run.commitSha}/`;
    if (url.hostname !== "github.com" || !url.pathname.startsWith(prefix))
      return null;
    const lines = /^#L(\d+)(?:-L(\d+))?$/u.exec(url.hash);
    const startLine = Number(lines?.[1]);
    const endLine = Number(lines?.[2] ?? lines?.[1]);
    if (!startLine || endLine < startLine || endLine - startLine > 20)
      return null;
    const path = url.pathname.slice(prefix.length);
    return {
      claim,
      path: path.split("/").map(decodeURIComponent).join("/"),
      startLine,
      endLine,
    };
  } catch {
    return null;
  }
}

function problem(claim: RunClaim): string {
  if (claim.kind === "file_exists")
    return `The documented path ${claim.params.path} does not exist in the repository at this commit.`;
  if (claim.kind === "script_exists")
    return `package.json has no script named ${claim.params.script}.`;
  if (claim.kind === "version")
    return `package.json does not declare a version matching ${claim.params.range}.`;
  return `Expected ${claim.expected}; observed ${claim.actual}.`;
}

function applyEdits(content: string, edits: readonly Edit[]): string {
  const lines = content.split("\n");
  const ordered = [...edits].sort((a, b) => b.startLine - a.startLine);
  for (const edit of ordered)
    lines.splice(
      edit.startLine - 1,
      edit.endLine - edit.startLine + 1,
      ...edit.replacement.split("\n"),
    );
  return lines.join("\n");
}

function withoutOverlaps(edits: readonly Edit[]): Edit[] {
  const kept: Edit[] = [];
  for (const edit of [...edits].sort((a, b) => a.startLine - b.startLine)) {
    const last = kept.at(-1);
    if (last && edit.startLine <= last.endLine) continue;
    kept.push(edit);
  }
  return kept;
}

function branchName(run: RunRecord, claimIds: readonly string[]): string {
  const hash = createHash("sha256")
    .update(`${run.id}\n${[...claimIds].sort().join(",")}`)
    .digest("hex")
    .slice(0, 12);
  return `groundcontrol/fix-scan-${hash}-${randomBytes(3).toString("hex")}`;
}

export class ScanCorrection {
  constructor(private readonly model: DocFixModel) {}

  async fix(
    github: GitHubFixPort,
    run: RunRecord,
    claimIds: readonly string[],
  ): Promise<FixResult<ScanFixOutcome>> {
    if (run.origin !== "public_scan")
      return { ok: false, error: { code: "unsupported_drift" } };
    const wanted = new Set(claimIds);
    const targets = run.results
      .filter(
        (claim) =>
          wanted.has(claim.claimId) &&
          claim.status === "fail" &&
          claim.state !== "dropped",
      )
      .map((claim) => citation(run, claim));
    const cited = targets.filter((item): item is Target => item !== null);
    if (cited.length === 0)
      return { ok: false, error: { code: "uncited_change" } };

    const packageJson = await github.readFile(
      run.repo,
      "package.json",
      run.commitSha,
    );
    const files = github.listFiles
      ? await github.listFiles(run.repo, run.commitSha)
      : null;
    const fileList = files?.ok ? files.value.slice(0, maxFiles) : [];

    const byPath = new Map<string, Target[]>();
    for (const target of cited)
      byPath.set(target.path, [...(byPath.get(target.path) ?? []), target]);

    const changed: { path: string; content: string; edits: Edit[] }[] = [];
    for (const [path, pathTargets] of byPath) {
      const original = await github.readFile(run.repo, path, run.commitSha);
      if (!original.ok) continue;
      const lines = original.value.split("\n");
      const edits: Edit[] = [];
      for (const target of pathTargets) {
        if (target.endLine > lines.length) continue;
        const text = lines
          .slice(target.startLine - 1, target.endLine)
          .join("\n");
        const proposed = await this.model.propose({
          path,
          finding: {
            kind: target.claim.kind,
            params: target.claim.params,
            quote: target.claim.quote,
            problem: problem(target.claim),
          },
          cited: {
            startLine: target.startLine,
            endLine: target.endLine,
            text,
          },
          context: {
            before: lines
              .slice(
                Math.max(0, target.startLine - 1 - contextLines),
                target.startLine - 1,
              )
              .join("\n"),
            after: lines
              .slice(target.endLine, target.endLine + contextLines)
              .join("\n"),
          },
          packageJson: packageJson.ok
            ? packageJson.value.slice(0, 6_000)
            : null,
          files: fileList,
        });
        if (!proposed.ok || proposed.value === null) continue;
        const replacement = proposed.value.replacement.replace(/\n+$/u, "");
        const span = target.endLine - target.startLine + 1;
        if (replacement === text || replacement.split("\n").length > span + 5)
          continue;
        edits.push({
          claimId: target.claim.claimId,
          startLine: target.startLine,
          endLine: target.endLine,
          replacement,
          summary: proposed.value.summary,
        });
      }
      const safe = withoutOverlaps(edits);
      if (safe.length > 0)
        changed.push({
          path,
          content: applyEdits(original.value, safe),
          edits: safe,
        });
    }

    const edits = changed.flatMap((file) =>
      file.edits.map((edit) => ({ ...edit, path: file.path })),
    );
    if (edits.length === 0)
      return { ok: false, error: { code: "unsupported_drift" } };
    const fixedClaimIds = [...new Set(edits.map((edit) => edit.claimId))];
    const draft = await github.createDraft({
      repo: run.repo,
      baseSha: run.commitSha,
      branch: branchName(run, fixedClaimIds),
      files: changed.map((file) => ({
        path: file.path,
        content: file.content,
      })),
      title: renderMessage("scanFixPrTitle", {
        count: edits.length,
        noun: edits.length === 1 ? "mismatch" : "mismatches",
      }),
      body: renderMessage("scanFixPrBody", {
        sha: run.commitSha.slice(0, 7),
        changes: edits
          .map(
            (edit) =>
              `- ${edit.path}:${edit.startLine}${edit.endLine > edit.startLine ? `-${edit.endLine}` : ""} ${edit.summary}`,
          )
          .join("\n"),
      }),
    });
    if (!draft.ok) return draft;
    return {
      ok: true,
      value: {
        pullRequestUrl: draft.value.url,
        commitSha: draft.value.commitSha,
        fixedClaimIds,
        skippedClaimIds: claimIds.filter((id) => !fixedClaimIds.includes(id)),
      },
    };
  }
}
