import type { HubDeps } from "./hub.ts";
import { renderMessage } from "./render.ts";
import type { ReplyRoute, Result } from "./types.ts";

export function runUrl(deps: HubDeps, runId: string): string {
  return `${deps.publicUrl}/runs/${encodeURIComponent(runId)}`;
}

async function reply(
  deps: HubDeps,
  route: ReplyRoute,
  text: string,
): Promise<Result<"handled">> {
  const sent = await deps.imessage.reply(route.chatId, text, route.linePhone);
  return sent.ok ? { ok: true, value: "handled" } : sent;
}

export async function answerStatus(
  deps: HubDeps,
  route: ReplyRoute,
  login: string,
): Promise<Result<"handled">> {
  const repos = [
    ...new Set(deps.messages.listAlerts(login).map((item) => item.repo)),
  ];
  if (repos.length === 0)
    return reply(deps, route, renderMessage("statusNone"));
  const lines = repos.slice(0, 10).map((name) => {
    const repo = deps.appStore.getRepo(name);
    return renderMessage("statusRepo", {
      repo: name,
      label: repo?.label ?? "unknown",
      degrees: repo?.driftDegrees ?? 0,
      url: repo?.latestRunId ? runUrl(deps, repo.latestRunId) : "",
    });
  });
  return reply(deps, route, lines.join("\n"));
}

export async function answerRun(
  deps: HubDeps,
  route: ReplyRoute,
  login: string,
  name: string,
): Promise<Result<"handled">> {
  const repo = deps.appStore.getRepo(name);
  const allowed =
    repo?.visibility === "public" ||
    deps.messages.listAlerts(login).some((item) => item.repo === name);
  const run =
    allowed && repo?.latestRunId
      ? deps.appStore.getRun(repo.latestRunId)
      : null;
  const commands = (run?.results ?? [])
    .filter(
      (item) =>
        item.kind === "command_succeeds" &&
        item.status === "pass" &&
        item.state === "confirmed",
    )
    .map((item) =>
      item.kind === "command_succeeds" ? item.params.command : "",
    );
  if (commands.length === 0)
    return reply(
      deps,
      route,
      renderMessage("runUnverified", {
        repo: name,
        url: run ? runUrl(deps, run.id) : "",
      }),
    );
  return reply(
    deps,
    route,
    renderMessage("runAnswer", {
      repo: name,
      steps: commands.slice(0, 5).join(", "),
      corrections: "",
    }),
  );
}

async function refreshPublicRepo(
  deps: HubDeps,
  name: string,
  unlinkedSenderHash?: string,
): Promise<boolean> {
  const existing = deps.appStore.getRepo(name);
  if (existing?.visibility === "private") return false;
  if (unlinkedSenderHash && !existing?.latestRunId) {
    const hour = Math.floor(deps.now().getTime() / 3_600_000);
    const quotaId = deps.cipher.hash(
      `public-scan:${unlinkedSenderHash}:${hour}`,
    );
    if (!deps.messages.claimInbound(quotaId)) return false;
  }
  if (!deps.scanner) return Boolean(existing?.latestRunId);
  try {
    if (!unlinkedSenderHash || !existing?.latestRunId)
      await deps.scanner.scanNow(name);
    return true;
  } catch {
    return false;
  }
}

export async function answerRepo(
  deps: HubDeps,
  route: ReplyRoute,
  name: string,
  unlinkedSenderHash?: string,
): Promise<Result<"handled">> {
  const ready = await refreshPublicRepo(deps, name, unlinkedSenderHash);
  if (!ready)
    return reply(deps, route, renderMessage("repoUnsupported", { repo: name }));
  const repo = deps.appStore.getRepo(name);
  const run = repo?.latestRunId ? deps.appStore.getRun(repo.latestRunId) : null;
  if (repo?.visibility !== "public" || !run)
    return reply(deps, route, renderMessage("repoUnsupported", { repo: name }));
  const issue = run.results.find(
    (item) => item.state === "confirmed" && item.status === "fail",
  );
  return reply(
    deps,
    route,
    renderMessage("repoResult", {
      claims: run.results.length,
      label: repo.label,
      degrees: repo.driftDegrees,
      topIssue: issue?.quote ?? "",
      url: runUrl(deps, run.id),
    }),
  );
}
