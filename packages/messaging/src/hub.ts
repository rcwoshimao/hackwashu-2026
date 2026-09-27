import type { AppStore, RunRecord } from "@ground-control/store";
import { sendDriftAlert, sendScanAlert } from "./alerts.ts";
import { answerRepo, answerRun, answerStatus } from "./answers.ts";
import { confirmCorrection, fixAlert } from "./corrections.ts";
import { type MessagingCipher, token32 } from "./identity.ts";
import { createLinkToken, normalizePhone, redeemLinkToken } from "./link.ts";
import { type Command, parseCommand } from "./parse.ts";
import { renderMessage } from "./render.ts";
import type {
  AlertRecord,
  CorrectionPort,
  IMessagePort,
  InboundMessage,
  MessagingStore,
  PublicScanPort,
  ReplyRoute,
  Result,
  ScanFixPort,
  TrustPort,
} from "./types.ts";

export type HubDeps = {
  appStore: AppStore;
  messages: MessagingStore;
  cipher: MessagingCipher;
  imessage: IMessagePort;
  correction: CorrectionPort;
  trust: TrustPort;
  scanner?: PublicScanPort;
  scanFix?: ScanFixPort;
  publicUrl: string;
  now: () => Date;
};

function openAlerts(deps: HubDeps, login: string): readonly AlertRecord[] {
  return deps.messages
    .listAlerts(login)
    .filter((item) => item.state === "open");
}

export class MessagingHub {
  constructor(private readonly deps: HubDeps) {}

  async requestLink(githubLogin: string, phone: string): Promise<Result<void>> {
    const address = normalizePhone(phone);
    if (!address || !/^[A-Za-z0-9-]{1,39}$/.test(githubLogin)) {
      return { ok: false, error: { code: "invalid_input" } };
    }
    const token = token32();
    const delivered = await this.deps.imessage.send(
      address,
      renderMessage("linkRequest", { token, user: githubLogin }),
    );
    if (!delivered.ok) return delivered;
    const created = createLinkToken(
      this.deps.messages,
      this.deps.cipher,
      githubLogin,
      address,
      delivered.value,
      this.deps.now().getTime(),
      token,
    );
    return created.ok ? { ok: true, value: undefined } : created;
  }

  async alert(run: RunRecord, authorLogin: string, codeChanged: boolean) {
    return sendDriftAlert({
      run,
      authorLogin,
      codeChanged,
      appStore: this.deps.appStore,
      messages: this.deps.messages,
      cipher: this.deps.cipher,
      imessage: this.deps.imessage,
      publicUrl: this.deps.publicUrl,
      now: this.deps.now(),
    });
  }

  async scanAlert(run: RunRecord, githubLogin: string) {
    return sendScanAlert({
      run,
      githubLogin,
      appStore: this.deps.appStore,
      messages: this.deps.messages,
      cipher: this.deps.cipher,
      imessage: this.deps.imessage,
      publicUrl: this.deps.publicUrl,
      now: this.deps.now(),
    });
  }

  async handleInbound(
    message: InboundMessage,
  ): Promise<Result<"handled" | "duplicate" | "ignored">> {
    const { messages, cipher } = this.deps;
    if (
      !messages.claimInbound(
        cipher.hash(
          `${message.linePhone ?? ""}:${message.chatId}:${message.id}`,
        ),
      )
    ) {
      return { ok: true, value: "duplicate" };
    }
    const command = parseCommand(message.text);
    if (command.kind === "link") return this.link(message, command.token);
    const senderHash = cipher.hash(message.senderId);
    const phone = message.senderAddress
      ? normalizePhone(message.senderAddress)
      : null;
    const addressHash = phone ? cipher.hash(phone) : null;
    const link = messages.getLinkBySender(senderHash, addressHash);
    if (link && addressHash && link.addressHash !== addressHash)
      return { ok: true, value: "ignored" };
    if (link === null) {
      if (command.kind === "repo")
        return answerRepo(this.deps, message, command.repo, senderHash);
      return { ok: true, value: "ignored" };
    }
    if (command.kind === "stop") {
      messages.deleteLink(link.senderHash);
      return this.reply(message, renderMessage("stop"));
    }
    return this.dispatch(message, link.senderHash, link.githubLogin, command);
  }

  private async link(
    message: InboundMessage,
    token: string,
  ): Promise<Result<"handled">> {
    const linked = redeemLinkToken(
      this.deps.messages,
      this.deps.cipher,
      token,
      message,
      this.deps.now().getTime(),
    );
    const text = linked.ok
      ? linked.value.welcome
      : renderMessage("linkInvalid");
    return this.reply(message, text);
  }

  private async reply(
    route: ReplyRoute,
    text: string,
  ): Promise<Result<"handled">> {
    const sent = await this.deps.imessage.reply(
      route.chatId,
      text,
      route.linePhone,
    );
    return sent.ok ? { ok: true, value: "handled" } : sent;
  }

  private async dispatch(
    route: ReplyRoute,
    hash: string,
    login: string,
    command: Command,
  ): Promise<Result<"handled">> {
    if (command.kind === "help")
      return this.reply(route, renderMessage("help"));
    if (command.kind === "status") return answerStatus(this.deps, route, login);
    if (command.kind === "run")
      return answerRun(this.deps, route, login, command.repo);
    if (command.kind === "repo")
      return this.ownRepo(route, login, command.repo);
    if (command.kind === "confirm" || command.kind === "drop") {
      return this.trust(route, login, command.claimId, command.kind);
    }
    if (command.kind === "choose")
      return this.choose(route, hash, command.index);
    if (
      command.kind === "fix" ||
      command.kind === "keep" ||
      command.kind === "ignore"
    ) {
      return this.decision(route, hash, login, command.kind);
    }
    return this.reply(route, renderMessage("unknown"));
  }

  private async ownRepo(
    route: ReplyRoute,
    login: string,
    name: string,
  ): Promise<Result<"handled">> {
    const answered = await answerRepo(this.deps, route, name);
    if (
      !answered.ok ||
      name.split("/")[0]?.toLowerCase() !== login.toLowerCase()
    )
      return answered;
    const latest = this.deps.appStore.getRepo(name)?.latestRunId;
    const run = latest ? this.deps.appStore.getRun(latest) : null;
    if (run) await this.scanAlert(run, login);
    return answered;
  }

  private async decision(
    route: ReplyRoute,
    hash: string,
    login: string,
    action: "fix" | "keep" | "ignore",
  ): Promise<Result<"handled">> {
    const alerts = openAlerts(this.deps, login);
    if (alerts.length === 0) return this.reply(route, renderMessage("noDrift"));
    if (alerts.length === 1 && alerts[0])
      return this.act(route, alerts[0], action);
    this.deps.messages.putPending(hash, {
      action,
      alertIds: alerts.map((item) => item.id),
    });
    const choices = alerts.map(
      (item, index) =>
        `${index + 1}. ${item.repo} ${item.commitSha.slice(0, 7)}`,
    );
    return this.reply(
      route,
      renderMessage("chooseDrift", { choices: choices.join("; ") }),
    );
  }

  private async choose(
    route: ReplyRoute,
    hash: string,
    index: number,
  ): Promise<Result<"handled">> {
    const pending = this.deps.messages.getPending(hash);
    const id = pending?.alertIds[index - 1];
    if (!pending || !id)
      return this.reply(route, renderMessage("choiceInvalid"));
    const alert = this.deps.messages.getAlert(id);
    this.deps.messages.putPending(hash, null);
    if (alert?.state !== "open")
      return this.reply(route, renderMessage("noDrift"));
    return this.act(route, alert, pending.action);
  }

  private async act(
    route: ReplyRoute,
    alert: AlertRecord,
    action: "fix" | "keep" | "ignore",
  ): Promise<Result<"handled">> {
    if (alert.kind === "scan") return this.actOnScan(route, alert, action);
    if (action === "fix") return fixAlert(this.deps, route, alert);
    if (action === "ignore") {
      for (const id of alert.claimIds)
        this.deps.messages.ignore(alert.repo, id);
      this.deps.messages.putAlert({ ...alert, state: "ignored" });
      return this.reply(route, renderMessage("ignoreDone"));
    }
    this.deps.messages.putAlert({ ...alert, state: "kept" });
    return this.reply(route, renderMessage("keepDone"));
  }

  private async actOnScan(
    route: ReplyRoute,
    alert: AlertRecord,
    action: "fix" | "keep" | "ignore",
  ): Promise<Result<"handled">> {
    const url = `${this.deps.publicUrl}/runs/${encodeURIComponent(alert.runId)}`;
    if (action === "keep") {
      this.deps.messages.putAlert({ ...alert, state: "kept" });
      return this.reply(route, renderMessage("scanKeepDone", { url }));
    }
    if (action === "ignore") {
      for (const id of alert.claimIds) {
        this.deps.messages.ignore(alert.repo, id);
        await this.deps.trust.set(alert.repo, id, "dropped");
      }
      this.deps.messages.putAlert({ ...alert, state: "ignored" });
      return this.reply(
        route,
        renderMessage("scanIgnoreDone", {
          count: alert.claimIds.length,
          noun: alert.claimIds.length === 1 ? "finding" : "findings",
        }),
      );
    }
    const run = this.deps.appStore.getRun(alert.runId);
    if (!run || !this.deps.scanFix)
      return this.reply(route, renderMessage("scanFixUnavailable", { url }));
    await this.reply(route, renderMessage("scanFixStarted"));
    const fixed = await this.deps.scanFix.fix(run, alert.claimIds);
    if (!fixed.ok)
      return this.reply(route, renderMessage("scanFixUnavailable", { url }));
    this.deps.messages.putAlert({
      ...alert,
      state: "fixing",
      pullRequestUrl: fixed.value.pullRequestUrl,
    });
    return this.reply(
      route,
      renderMessage("scanFixDone", {
        count: fixed.value.fixedClaimIds.length,
        total: alert.claimIds.length,
        pr: fixed.value.pullRequestUrl,
      }),
    );
  }

  async confirmCorrection(run: RunRecord): Promise<Result<boolean>> {
    return confirmCorrection(this.deps, run);
  }

  private async trust(
    route: ReplyRoute,
    login: string,
    claimId: string,
    action: "confirm" | "drop",
  ): Promise<Result<"handled">> {
    const owned = this.deps.messages.findOwnedClaim(login, claimId);
    if (!owned) return this.reply(route, renderMessage("claimUnknown"));
    const outcome = await this.deps.trust.set(
      owned.repo,
      claimId,
      action === "confirm" ? "confirmed" : "dropped",
    );
    if (!outcome.ok) return this.reply(route, renderMessage("claimUnknown"));
    const key =
      action === "drop"
        ? "dropDone"
        : outcome.value.failing
          ? "confirmDrift"
          : "confirmDone";
    return this.reply(route, renderMessage(key, { id: claimId }));
  }
}
