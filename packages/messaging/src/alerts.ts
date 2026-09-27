import { createHash } from "node:crypto";
import type { AppStore, RunRecord } from "@ground-control/store";
import type { MessagingCipher } from "./identity.ts";
import { renderMessage } from "./render.ts";
import type {
  AlertRecord,
  IMessagePort,
  MessagingStore,
  Result,
} from "./types.ts";

function alertId(run: RunRecord): string {
  const hash = createHash("sha256")
    .update(`${run.repo}\n${run.commitSha}`)
    .digest("hex");
  return `drift_${hash.slice(0, 20)}`;
}

function confirmedFailures(
  run: RunRecord,
): readonly RunRecord["results"][number][] {
  return run.results.filter(
    (item) => item.state === "confirmed" && item.status === "fail",
  );
}

function newFailure(
  run: RunRecord,
  store: AppStore,
  messages: MessagingStore,
): boolean {
  const previous = store.listRuns(run.repo).find((item) => item.id !== run.id);
  const old = new Set(
    previous ? confirmedFailures(previous).map((item) => item.claimId) : [],
  );
  return confirmedFailures(run).some(
    (item) =>
      !old.has(item.claimId) && !messages.isIgnored(run.repo, item.claimId),
  );
}

function sourceNames(sourceIds: readonly string[], store: AppStore): string {
  const names = sourceIds.map((id) => store.getSource(id)?.title ?? id);
  return names.join(", ").slice(0, 900);
}

export async function sendDriftAlert(input: {
  run: RunRecord;
  authorLogin: string;
  codeChanged: boolean;
  appStore: AppStore;
  messages: MessagingStore;
  cipher: MessagingCipher;
  imessage: IMessagePort;
  publicUrl: string;
  now: Date;
}): Promise<Result<{ sent: boolean; alertId: string | null }>> {
  const { run, authorLogin, appStore, messages, cipher, imessage } = input;
  messages.putOwnedClaims(authorLogin, run);
  if (
    !input.codeChanged ||
    run.verdict !== "failure" ||
    !newFailure(run, appStore, messages)
  ) {
    return { ok: true, value: { sent: false, alertId: null } };
  }
  const link = messages.getLinkByGithub(authorLogin);
  if (link === null) return { ok: true, value: { sent: false, alertId: null } };
  const chatId = cipher.open(link.encryptedChatId);
  const linePhone = link.encryptedLinePhone
    ? cipher.open(link.encryptedLinePhone)
    : null;
  if (!chatId || (link.encryptedLinePhone && !linePhone))
    return { ok: false, error: { code: "invalid_input" } };
  const failures = confirmedFailures(run).filter(
    (item) => !messages.isIgnored(run.repo, item.claimId),
  );
  const alert: AlertRecord = {
    id: alertId(run),
    githubLogin: authorLogin,
    repo: run.repo,
    commitSha: run.commitSha,
    runId: run.id,
    claimIds: [...new Set(failures.map((item) => item.claimId))],
    sourceIds: [...new Set(failures.map((item) => item.sourceId))],
    state: "open",
    delivery: "reserved",
    createdAt: input.now.toISOString(),
  };
  if (!messages.reserveAlert(alert))
    return { ok: true, value: { sent: false, alertId: alert.id } };
  const text = renderMessage("driftAlertMulti", {
    sha: run.commitSha.slice(0, 7),
    count: alert.sourceIds.length,
    docNoun: alert.sourceIds.length === 1 ? "doc" : "docs",
    verb: alert.sourceIds.length === 1 ? "has" : "have",
    locations: sourceNames(alert.sourceIds, appStore),
    url: `${input.publicUrl}/runs/${encodeURIComponent(run.id)}`,
  });
  const delivered = await imessage.reply(chatId, text, linePhone ?? undefined);
  messages.putAlert({ ...alert, delivery: delivered.ok ? "sent" : "failed" });
  return delivered.ok
    ? { ok: true, value: { sent: true, alertId: alert.id } }
    : delivered;
}

type ScanFinding = RunRecord["results"][number];

function scanFindings(
  run: RunRecord,
  messages: MessagingStore,
): readonly ScanFinding[] {
  return run.results.filter(
    (item) =>
      item.status === "fail" &&
      item.state !== "dropped" &&
      !messages.isIgnored(run.repo, item.claimId),
  );
}

function findingProblem(item: ScanFinding): string {
  if (item.kind === "file_exists") return `${item.params.path} not found`;
  if (item.kind === "script_exists")
    return `no "${item.params.script}" script in package.json`;
  if (item.kind === "version")
    return `package.json doesn't declare ${item.params.range}`;
  return "doesn't match the code";
}

function findingLines(findings: readonly ScanFinding[]): string {
  const shown = findings.slice(0, 3).map((item, index) => {
    const quote =
      item.quote.length > 70 ? `${item.quote.slice(0, 67)}...` : item.quote;
    return `${index + 1}) "${quote}" (${findingProblem(item)})`;
  });
  if (findings.length > shown.length)
    shown.push(`+${findings.length - shown.length} more`);
  return shown.join("\n");
}

export async function sendScanAlert(input: {
  run: RunRecord;
  githubLogin: string;
  appStore: AppStore;
  messages: MessagingStore;
  cipher: MessagingCipher;
  imessage: IMessagePort;
  publicUrl: string;
  now: Date;
}): Promise<Result<{ sent: boolean; alertId: string | null }>> {
  const { run, githubLogin, messages, cipher, imessage } = input;
  if (run.origin !== "public_scan")
    return { ok: true, value: { sent: false, alertId: null } };
  const findings = scanFindings(run, messages);
  if (findings.length === 0)
    return { ok: true, value: { sent: false, alertId: null } };
  const link = messages.getLinkByGithub(githubLogin);
  if (link === null) return { ok: true, value: { sent: false, alertId: null } };
  messages.putOwnedClaims(githubLogin, run);
  const chatId = cipher.open(link.encryptedChatId);
  const linePhone = link.encryptedLinePhone
    ? cipher.open(link.encryptedLinePhone)
    : null;
  if (!chatId || (link.encryptedLinePhone && !linePhone))
    return { ok: false, error: { code: "invalid_input" } };
  const alert: AlertRecord = {
    id: `scan_${createHash("sha256").update(run.id).digest("hex").slice(0, 20)}`,
    kind: "scan",
    githubLogin,
    repo: run.repo,
    commitSha: run.commitSha,
    runId: run.id,
    claimIds: [...new Set(findings.map((item) => item.claimId))],
    sourceIds: [...new Set(findings.map((item) => item.sourceId))],
    state: "open",
    delivery: "reserved",
    createdAt: input.now.toISOString(),
  };
  if (!messages.reserveAlert(alert))
    return { ok: true, value: { sent: false, alertId: alert.id } };
  const text = renderMessage("scanAlert", {
    repo: run.repo,
    sha: run.commitSha.slice(0, 7),
    count: findings.length,
    noun: findings.length === 1 ? "mismatch" : "mismatches",
    findings: findingLines(findings),
    url: `${input.publicUrl}/runs/${encodeURIComponent(run.id)}`,
  });
  const delivered = await imessage.reply(chatId, text, linePhone ?? undefined);
  messages.putAlert({ ...alert, delivery: delivered.ok ? "sent" : "failed" });
  return delivered.ok
    ? { ok: true, value: { sent: true, alertId: alert.id } }
    : delivered;
}
