import type { RunRecord } from "@ground-control/store";
import type {
  AlertRecord,
  LinkRecord,
  LinkTokenRecord,
  MessagingStore,
  OwnedClaim,
  PendingChoice,
} from "./types.ts";

export class MemoryMessagingStore implements MessagingStore {
  private readonly tokens = new Map<string, LinkTokenRecord>();
  private readonly links = new Map<string, LinkRecord>();
  private readonly inbound = new Set<string>();
  private readonly alerts = new Map<string, AlertRecord>();
  private readonly ignored = new Set<string>();
  private readonly pending = new Map<string, PendingChoice>();
  private readonly owned = new Map<string, OwnedClaim>();

  putLinkToken(token: LinkTokenRecord): void {
    this.tokens.set(token.hash, token);
  }
  consumeLinkToken(
    hash: string,
    senderHash: string,
    addressHash: string | null,
    routeHash: string,
    lineHash: string | null,
    nowMs: number,
  ): LinkTokenRecord | null {
    const token = this.tokens.get(hash);
    if (!token || token.expiresAt <= nowMs) return null;
    if (addressHash && token.addressHash !== addressHash) return null;
    if (lineHash && token.lineHash && token.lineHash !== lineHash) return null;
    const sameRoute =
      token.routeHash === routeHash &&
      (!token.lineHash || !lineHash || token.lineHash === lineHash);
    const sameAddress =
      addressHash !== null && token.addressHash === addressHash;
    const sameUser = token.recipientIdHash === senderHash;
    if (!sameRoute && !sameAddress && !sameUser) return null;
    this.tokens.delete(hash);
    return token;
  }
  putLink(link: LinkRecord): void {
    for (const old of this.links.values()) {
      if (
        old.githubLogin.toLowerCase() === link.githubLogin.toLowerCase() ||
        old.senderHash === link.senderHash ||
        old.addressHash === link.addressHash
      )
        this.links.delete(old.senderHash);
    }
    this.links.set(link.senderHash, link);
  }
  getLinkByGithub(login: string): LinkRecord | null {
    return (
      [...this.links.values()].find(
        (item) => item.githubLogin.toLowerCase() === login.toLowerCase(),
      ) ?? null
    );
  }
  getLinkBySender(
    senderHash: string,
    addressHash: string | null,
  ): LinkRecord | null {
    return (
      this.links.get(senderHash) ??
      [...this.links.values()].find(
        (item) => item.addressHash === addressHash,
      ) ??
      null
    );
  }
  deleteLink(hash: string): void {
    this.links.delete(hash);
    this.pending.delete(hash);
  }
  claimInbound(messageId: string): boolean {
    if (this.inbound.has(messageId)) return false;
    this.inbound.add(messageId);
    return true;
  }
  reserveAlert(alert: AlertRecord): boolean {
    if (this.alerts.has(alert.id)) return false;
    this.alerts.set(alert.id, alert);
    return true;
  }
  getAlert(id: string): AlertRecord | null {
    return this.alerts.get(id) ?? null;
  }
  putAlert(alert: AlertRecord): void {
    this.alerts.set(alert.id, alert);
  }
  listAlerts(login: string): readonly AlertRecord[] {
    return [...this.alerts.values()]
      .filter((item) => item.githubLogin.toLowerCase() === login.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  findCorrection(repo: string, commitSha: string): AlertRecord | null {
    return (
      [...this.alerts.values()].find(
        (item) =>
          item.repo === repo &&
          item.correctionCommitSha === commitSha &&
          item.state === "fixing",
      ) ?? null
    );
  }
  isIgnored(repo: string, claimId: string): boolean {
    return this.ignored.has(`${repo}\n${claimId}`);
  }
  ignore(repo: string, claimId: string): void {
    this.ignored.add(`${repo}\n${claimId}`);
  }
  unignore(repo: string, claimId: string): void {
    this.ignored.delete(`${repo}\n${claimId}`);
  }
  getPending(hash: string): PendingChoice | null {
    return this.pending.get(hash) ?? null;
  }
  putPending(hash: string, choice: PendingChoice | null): void {
    if (choice === null) this.pending.delete(hash);
    else this.pending.set(hash, choice);
  }
  putOwnedClaims(login: string, run: RunRecord): void {
    for (const item of run.results) {
      const claim = {
        githubLogin: login,
        claimId: item.claimId,
        repo: run.repo,
        runId: run.id,
        at: run.createdAt,
      };
      this.owned.set(
        `${login.toLowerCase()}\n${item.claimId}\n${run.repo}`,
        claim,
      );
    }
  }
  findOwnedClaim(login: string, claimId: string): OwnedClaim | null {
    return (
      [...this.owned.values()]
        .filter(
          (item) =>
            item.githubLogin.toLowerCase() === login.toLowerCase() &&
            item.claimId === claimId,
        )
        .sort((a, b) => b.at.localeCompare(a.at))[0] ?? null
    );
  }
}
