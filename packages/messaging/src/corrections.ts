import type { RunRecord } from "@ground-control/store";
import { runUrl } from "./answers.ts";
import type { HubDeps } from "./hub.ts";
import { renderMessage } from "./render.ts";
import type { AlertRecord, FixOutcome, ReplyRoute, Result } from "./types.ts";

async function reply(
  deps: HubDeps,
  route: ReplyRoute,
  text: string,
): Promise<Result<"handled">> {
  const sent = await deps.imessage.reply(route.chatId, text, route.linePhone);
  return sent.ok ? { ok: true, value: "handled" } : sent;
}

function fixExtras(deps: HubDeps, outcome: FixOutcome, url: string): string {
  const extras = (outcome.wikiSuggestions ?? []).map((item) =>
    renderMessage("wikiSuggestion", {
      source: deps.appStore.getSource(item.sourceId)?.title ?? item.sourceId,
      text: item.text.slice(0, 500),
    }),
  );
  if (outcome.urlEvidence?.length)
    extras.push(
      renderMessage("fixEvidenceOnly", {
        count: outcome.urlEvidence.length,
        url,
      }),
    );
  const confluenceCount = outcome.delivered.filter(
    (id) => deps.appStore.getSource(id)?.kind === "confluence",
  ).length;
  if (confluenceCount > 0)
    extras.push(
      renderMessage("fixConfluencePosted", { count: confluenceCount }),
    );
  return extras.join(" ");
}

async function reportFix(
  deps: HubDeps,
  route: ReplyRoute,
  alert: AlertRecord,
  outcome: FixOutcome,
  url: string,
): Promise<Result<"handled">> {
  const extras = fixExtras(deps, outcome, url);
  if (
    outcome.pendingCi &&
    outcome.pullRequestUrl &&
    outcome.correctionCommitSha
  ) {
    deps.messages.putAlert({
      ...alert,
      state: "fixing",
      correctionCommitSha: outcome.correctionCommitSha,
      pullRequestUrl: outcome.pullRequestUrl,
    });
    return reply(
      deps,
      route,
      renderMessage("fixPending", { pr: outcome.pullRequestUrl, extras }),
    );
  }
  if (outcome.verified && outcome.pullRequestUrl) {
    deps.messages.putAlert({ ...alert, state: "fixed" });
    return reply(
      deps,
      route,
      renderMessage("fixDone", {
        count: outcome.passedCheckCount,
        pr: outcome.pullRequestUrl,
      }),
    );
  }
  if (outcome.delivered.length === 0)
    return reply(deps, route, renderMessage("fixUnavailable", { url }));
  deps.messages.putAlert({ ...alert, state: "fixing" });
  return reply(
    deps,
    route,
    renderMessage("fixSuggestions", {
      delivered: outcome.delivered.length,
      extras,
      url,
    }),
  );
}

export async function fixAlert(
  deps: HubDeps,
  route: ReplyRoute,
  alert: AlertRecord,
): Promise<Result<"handled">> {
  const run = deps.appStore.getRun(alert.runId);
  const url = runUrl(deps, alert.runId);
  if (!run) return reply(deps, route, renderMessage("fixUnavailable", { url }));
  const result = await deps.correction.fix(alert, run, deps.appStore);
  if (!result.ok)
    return reply(deps, route, renderMessage("fixUnavailable", { url }));
  return reportFix(deps, route, alert, result.value, url);
}

export async function confirmCorrection(
  deps: HubDeps,
  run: RunRecord,
): Promise<Result<boolean>> {
  const alert = deps.messages.findCorrection(run.repo, run.commitSha);
  if (!alert || !deps.correction.verifyDraft) return { ok: true, value: false };
  const checked = await deps.correction.verifyDraft(run.repo, run.commitSha);
  if (!checked.ok || checked.value === "pending")
    return { ok: true, value: false };
  const passed =
    checked.value === "success" &&
    run.results.length > 0 &&
    run.results.every((item) => item.status === "pass");
  deps.messages.putAlert({ ...alert, state: passed ? "fixed" : "open" });
  const link = deps.messages.getLinkByGithub(alert.githubLogin);
  const chatId = link ? deps.cipher.open(link.encryptedChatId) : null;
  const linePhone = link?.encryptedLinePhone
    ? deps.cipher.open(link.encryptedLinePhone)
    : null;
  if (!chatId) return { ok: true, value: passed };
  if (link?.encryptedLinePhone && !linePhone)
    return { ok: false, error: { code: "invalid_input" } };
  const text = passed
    ? renderMessage("fixDone", {
        count: run.results.length,
        pr: alert.pullRequestUrl ?? "",
      })
    : renderMessage("fixCiFailed", {
        pr: alert.pullRequestUrl ?? "",
        url: runUrl(deps, run.id),
      });
  const sent = await deps.imessage.reply(chatId, text, linePhone ?? undefined);
  return sent.ok ? { ok: true, value: passed } : sent;
}
