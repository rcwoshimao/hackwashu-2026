import type { AlertRecord } from "@ground-control/messaging";
import type { FlightPlan } from "@ground-control/plan";
import { flightPlanSchema } from "@ground-control/plan";
import type { AppStore, RunClaim, RunRecord } from "@ground-control/store";
import { rebaseFlightPlan } from "./rebase-plan.ts";
import type {
  CorrectionProposal,
  FileChange,
  FixResult,
  GitHubFixPort,
} from "./types.ts";

type PortFailure = Extract<RunClaim, { kind: "port_listens" }>;
type CitedFile = { path: string; line: number; claim: PortFailure };

function actualPort(actual: string): number | null {
  if (/EADDRINUSE/iu.test(actual)) return null;
  const matches = [...actual.matchAll(/\blistening on[^\r\n\d]*(\d{1,5})\b/giu)]
    .map((match) => Number(match[1]))
    .filter((port) => port >= 1 && port <= 65535);
  return new Set(matches).size === 1 ? (matches[0] ?? null) : null;
}

function confirmedFailures(alert: AlertRecord, run: RunRecord): PortFailure[] {
  return run.results.filter(
    (item): item is PortFailure =>
      alert.claimIds.includes(item.claimId) &&
      item.kind === "port_listens" &&
      item.state === "confirmed" &&
      item.status === "fail",
  );
}

function portPair(
  claims: readonly PortFailure[],
): { old: number; next: number } | null {
  const first = claims[0];
  const next = first ? actualPort(first.actual) : null;
  if (!first || next === null || next === first.params.port) return null;
  if (
    claims.some(
      (claim) =>
        claim.params.port !== first.params.port ||
        actualPort(claim.actual) !== next,
    )
  )
    return null;
  return { old: first.params.port, next };
}

function fileKind(path: string): "readme" | "docs" | "man" | null {
  if (path === "README.md") return "readme";
  if (/^docs\/(?:[^/.][^/]*\/)*[^/.][^/]*\.md$/u.test(path)) return "docs";
  if (/^man\/(?:[^/.][^/]*)+\.[1-9]$/u.test(path)) return "man";
  return null;
}

function citedFile(
  repo: string,
  sha: string,
  claim: PortFailure,
  store: AppStore,
): CitedFile | null {
  if (!claim.deepLink) return null;
  try {
    const url = new URL(claim.deepLink);
    const prefix = `/${repo}/blob/${sha}/`;
    if (url.hostname !== "github.com" || !url.pathname.startsWith(prefix))
      return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    const kind = fileKind(path);
    const source = store.getSource(claim.sourceId);
    const line = /^#L(\d+)(?:-L\1)?$/u.exec(url.hash)?.[1];
    if (!kind || (source && source.kind !== kind) || !line) return null;
    return { path, line: Number(line), claim };
  } catch {
    return null;
  }
}

function lineRange(
  text: string,
  line: number,
): { start: number; end: number } | null {
  if (!Number.isSafeInteger(line) || line < 1) return null;
  let start = 0;
  for (let index = 1; index < line; index += 1) {
    const newline = text.indexOf("\n", start);
    if (newline < 0) return null;
    start = newline + 1;
  }
  const newline = text.indexOf("\n", start);
  return { start, end: newline < 0 ? text.length : newline };
}

function citedEdit(
  text: string,
  item: CitedFile,
  oldPort: number,
  newPort: number,
  plan: FlightPlan,
): FileChange["edits"][number] | null {
  const range = lineRange(text, item.line);
  const line = range ? text.slice(range.start, range.end) : "";
  const quoteAt = line.indexOf(item.claim.quote);
  const old = String(oldPort);
  const matches = [
    ...item.claim.quote.matchAll(new RegExp(`(?<!\\d)${old}(?!\\d)`, "gu")),
  ];
  const planned = plan.claims.find((claim) => claim.id === item.claim.claimId);
  const occurrence = planned?.occurrences.find(
    (entry) =>
      entry.quote === item.claim.quote && entry.location.kind === "file",
  );
  if (
    !range ||
    quoteAt < 0 ||
    line.indexOf(item.claim.quote, quoteAt + 1) >= 0 ||
    matches.length !== 1 ||
    !occurrence ||
    occurrence.location.kind !== "file" ||
    occurrence.location.path !== item.path ||
    occurrence.location.lineStart !== item.line ||
    occurrence.location.startOffset !== range.start + quoteAt
  )
    return null;
  const startOffset = range.start + quoteAt + (matches[0]?.index ?? 0);
  return {
    startOffset,
    endOffset: startOffset + old.length,
    replacement: String(newPort),
    claimId: item.claim.claimId,
    sourceId: item.claim.sourceId,
  };
}

function changedFile(
  path: string,
  text: string,
  cited: readonly CitedFile[],
  oldPort: number,
  newPort: number,
  plan: FlightPlan,
): FileChange | null {
  const edits = cited.map((item) =>
    citedEdit(text, item, oldPort, newPort, plan),
  );
  if (edits.some((edit) => edit === null)) return null;
  const ordered = edits
    .filter((edit) => edit !== null)
    .sort((a, b) => a.startOffset - b.startOffset);
  if (
    ordered.some(
      (edit, index) =>
        index > 0 && edit.startOffset < (ordered[index - 1]?.endOffset ?? 0),
    )
  )
    return null;
  let after = text;
  for (const edit of [...ordered].reverse())
    after = `${after.slice(0, edit.startOffset)}${edit.replacement}${after.slice(edit.endOffset)}`;
  return {
    path,
    before: text,
    after,
    citedLines: [...new Set(cited.map((item) => item.line))],
    edits: ordered,
  };
}

function suggestedText(
  quote: string,
  oldPort: number,
  newPort: number,
): string | null {
  const expression = new RegExp(`(?<!\\d)${oldPort}(?!\\d)`, "gu");
  return [...quote.matchAll(expression)].length === 1
    ? quote.replace(expression, String(newPort))
    : null;
}

export async function proposeCorrection(
  github: GitHubFixPort,
  alert: AlertRecord,
  run: RunRecord,
  store: AppStore,
): Promise<FixResult<CorrectionProposal>> {
  const failures = confirmedFailures(alert, run);
  const ports = portPair(failures);
  if (!ports || run.repo !== alert.repo || run.commitSha !== alert.commitSha)
    return { ok: false, error: { code: "unsupported_drift" } };
  const code = await github.readFile(run.repo, "src/server.js", run.commitSha);
  if (!code.ok) return code;
  if (!code.value.includes(`process.env.PORT ?? "${ports.next}"`))
    return { ok: false, error: { code: "unsupported_drift" } };
  const cited = failures.map((claim) =>
    citedFile(run.repo, run.commitSha, claim, store),
  );
  const files = cited.filter((item) => item !== null);
  const unknown = failures.filter((claim) => {
    const source = store.getSource(claim.sourceId);
    return (
      !files.some((item) => item.claim === claim) &&
      source?.kind !== "wiki" &&
      source?.kind !== "url" &&
      source?.kind !== "confluence"
    );
  });
  if (unknown.length > 0)
    return { ok: false, error: { code: "uncited_change" } };
  const wikiSuggestions = failures.flatMap((claim) => {
    if (store.getSource(claim.sourceId)?.kind !== "wiki") return [];
    const text = suggestedText(claim.quote, ports.old, ports.next);
    return text ? [{ sourceId: claim.sourceId, text }] : [];
  });
  const urlEvidence = failures
    .filter((claim) => store.getSource(claim.sourceId)?.kind === "url")
    .map((claim) => claim.sourceId);
  if (files.length === 0)
    return {
      ok: true,
      value: {
        oldPort: ports.old,
        newPort: ports.next,
        files: [],
        plan: null,
        wikiSuggestions,
        urlEvidence,
      },
    };
  const planFile = await github.readFile(
    run.repo,
    "flightchecks/flightplan.json",
    run.commitSha,
  );
  if (!planFile.ok) return planFile;
  let rawPlan: unknown;
  try {
    rawPlan = JSON.parse(planFile.value) as unknown;
  } catch {
    return { ok: false, error: { code: "stale_plan" } };
  }
  const parsed = flightPlanSchema.safeParse(rawPlan);
  if (!parsed.success || parsed.data.repo !== run.repo)
    return { ok: false, error: { code: "stale_plan" } };
  const changes: FileChange[] = [];
  for (const path of [...new Set(files.map((item) => item.path))]) {
    const read = await github.readFile(run.repo, path, run.commitSha);
    if (!read.ok) return read;
    const change = changedFile(
      path,
      read.value,
      files.filter((item) => item.path === path),
      ports.old,
      ports.next,
      parsed.data,
    );
    if (!change) return { ok: false, error: { code: "uncited_change" } };
    changes.push(change);
  }
  const rebased = rebaseFlightPlan(parsed.data, changes, ports.next);
  if (!rebased.ok) return rebased;
  return {
    ok: true,
    value: {
      oldPort: ports.old,
      newPort: ports.next,
      files: changes,
      plan: rebased.value,
      wikiSuggestions,
      urlEvidence,
    },
  };
}
