import type { PrCommentPort } from "@ground-control/fixes";
import {
  CompositeCorrection,
  commentOnConfirmedDrift,
  OctokitFixes,
  RepoCorrection,
} from "@ground-control/fixes";
import {
  ConfluenceCorrection,
  createSpectrumIMessage,
  MessagingCipher,
  MessagingHub,
  SqliteMessagingStore,
  UnavailableCorrection,
} from "@ground-control/messaging";
import { ConfluenceCloud } from "@ground-control/sources";
import type { AppStore, RunRecord } from "@ground-control/store";
import type { ScanFixService } from "./scan-fix.ts";
import { refreshTrust } from "./telemetry.ts";
import type { CommitStatusPort, EventHub } from "./types.ts";

export async function postPrEvidence(
  config: {
    store: AppStore;
    events: EventHub;
    publicUrl: string;
    prComments?: PrCommentPort | undefined;
  },
  run: RunRecord,
): Promise<void> {
  if (!run.pullRequestNumber || !config.prComments) return;
  const comment = await commentOnConfirmedDrift(
    config.store,
    run,
    run.pullRequestNumber,
    config.publicUrl,
    config.prComments,
  );
  if (comment.ok) return;
  const event = config.store.appendEvent(
    "pr_comment_failed",
    new Date().toISOString(),
    { repo: run.repo, runId: run.id },
  );
  config.events.publish(event);
}

export async function startMessaging(config: {
  dbPath: string;
  secret: string;
  publicUrl: string;
  store: AppStore;
  events: EventHub;
  scanner: { scanNow(repo: string): Promise<void> };
  status?: CommitStatusPort;
  projectId?: string | undefined;
  projectSecret?: string | undefined;
  confluenceSite?: string | undefined;
  confluenceEmail?: string | undefined;
  confluenceToken?: string | undefined;
  githubWriteToken?: string | undefined;
  prComments?: PrCommentPort | undefined;
  scanFix?: ScanFixService | undefined;
}): Promise<MessagingHub | null> {
  if (!config.projectId || !config.projectSecret) return null;
  const runtime = await createSpectrumIMessage({
    projectId: config.projectId,
    projectSecret: config.projectSecret,
  });
  if (!runtime.ok) {
    const event = config.store.appendEvent(
      "message_start_failed",
      new Date().toISOString(),
      { reason: runtime.error.code },
    );
    config.events.publish(event);
    return null;
  }
  const messages = new SqliteMessagingStore(config.dbPath);
  const confluence =
    config.confluenceSite && config.confluenceEmail && config.confluenceToken
      ? new ConfluenceCloud(
          config.confluenceSite,
          config.confluenceEmail,
          config.confluenceToken,
        )
      : null;
  const pageCorrection = confluence
    ? new ConfluenceCorrection(confluence, config.publicUrl)
    : null;
  const correction = config.githubWriteToken
    ? new CompositeCorrection(
        new RepoCorrection(new OctokitFixes(config.githubWriteToken)),
        pageCorrection,
      )
    : (pageCorrection ?? new UnavailableCorrection());
  const hub = new MessagingHub({
    appStore: config.store,
    messages,
    cipher: new MessagingCipher(config.secret),
    imessage: runtime.value,
    correction,
    scanner: config.scanner,
    ...(config.scanFix
      ? {
          scanFix: {
            fix: async (run, claimIds) => {
              const fixed = await config.scanFix?.fix(run, claimIds);
              return fixed?.ok
                ? { ok: true as const, value: fixed.value }
                : {
                    ok: false as const,
                    error: { code: "unavailable" as const },
                  };
            },
          },
        }
      : {}),
    publicUrl: config.publicUrl,
    now: () => new Date(),
    trust: {
      async set(repo, claimId, state) {
        const latest = refreshTrust(config.store, repo, claimId, state);
        if (latest === null) return { ok: false, error: { code: "not_found" } };
        if (config.status && latest.origin !== "public_scan")
          await config.status.post(latest);
        if (state === "confirmed" && latest.origin !== "public_scan")
          await postPrEvidence(config, latest);
        const failing = latest.results.some(
          (item) =>
            item.claimId === claimId &&
            item.state === "confirmed" &&
            item.status === "fail",
        );
        return { ok: true, value: { failing } };
      },
    },
  });
  void runtime.value
    .run(
      async (message) => {
        const handled = await hub.handleInbound(message);
        if (!handled.ok) {
          const event = config.store.appendEvent(
            "message_failed",
            new Date().toISOString(),
            { messageId: message.id },
          );
          config.events.publish(event);
        }
      },
      () => {
        const event = config.store.appendEvent(
          "message_loop_failed",
          new Date().toISOString(),
          {},
        );
        config.events.publish(event);
      },
    )
    .catch(() => {
      const event = config.store.appendEvent(
        "message_loop_failed",
        new Date().toISOString(),
        {},
      );
      config.events.publish(event);
    });
  return hub;
}
