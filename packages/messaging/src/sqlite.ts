import { Database } from "bun:sqlite";
import type { RunRecord } from "@ground-control/store";
import { type LinkRow, linkRecord, type TokenRow } from "./sqlite-link.ts";
import type {
  AlertRecord,
  LinkRecord,
  LinkTokenRecord,
  MessagingStore,
  OwnedClaim,
  PendingChoice,
} from "./types.ts";

type BodyRow = { body: string };

export class SqliteMessagingStore implements MessagingStore {
  private readonly db: Database;

  constructor(path: string) {
    this.db = new Database(path, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(`CREATE TABLE IF NOT EXISTS messaging_inbound (message_id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS messaging_alerts (
      id TEXT PRIMARY KEY, github_login TEXT NOT NULL, created_at TEXT NOT NULL, body TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS messaging_alerts_login ON messaging_alerts(github_login, created_at);
      CREATE TABLE IF NOT EXISTS messaging_ignored (
      repo TEXT NOT NULL, claim_id TEXT NOT NULL, PRIMARY KEY(repo, claim_id));
      CREATE TABLE IF NOT EXISTS messaging_owned_claims (
      github_login TEXT NOT NULL, claim_id TEXT NOT NULL, repo TEXT NOT NULL,
      run_id TEXT NOT NULL, at TEXT NOT NULL,
      PRIMARY KEY(github_login, claim_id, repo));
      CREATE TABLE IF NOT EXISTS messaging_imessage_tokens (
      hash TEXT PRIMARY KEY, github_login TEXT NOT NULL, address_hash TEXT NOT NULL,
      route_hash TEXT NOT NULL, recipient_id_hash TEXT, line_hash TEXT,
      address_cipher TEXT NOT NULL, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS messaging_imessage_links (
      sender_hash TEXT PRIMARY KEY, address_hash TEXT NOT NULL UNIQUE,
      github_login TEXT NOT NULL UNIQUE, address_cipher TEXT NOT NULL,
      chat_cipher TEXT NOT NULL, line_cipher TEXT);
      CREATE TABLE IF NOT EXISTS messaging_imessage_pending (
      sender_hash TEXT PRIMARY KEY, body TEXT NOT NULL);`);
  }

  close(): void {
    this.db.close();
  }

  putLinkToken(token: LinkTokenRecord): void {
    this.db
      .query(
        "INSERT INTO messaging_imessage_tokens VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        token.hash,
        token.githubLogin,
        token.addressHash,
        token.routeHash,
        token.recipientIdHash ?? null,
        token.lineHash ?? null,
        token.encryptedAddress,
        token.expiresAt,
      );
  }

  consumeLinkToken(
    hash: string,
    senderHash: string,
    addressHash: string | null,
    routeHash: string,
    lineHash: string | null,
    nowMs: number,
  ): LinkTokenRecord | null {
    return this.db.transaction(() => {
      const row = this.db
        .query("SELECT * FROM messaging_imessage_tokens WHERE hash = ?")
        .get(hash) as TokenRow | null;
      if (!row || row.expires_at <= nowMs) return null;
      if (addressHash && row.address_hash !== addressHash) return null;
      if (lineHash && row.line_hash && row.line_hash !== lineHash) return null;
      const sameRoute =
        row.route_hash === routeHash &&
        (!row.line_hash || !lineHash || row.line_hash === lineHash);
      const sameAddress =
        addressHash !== null && row.address_hash === addressHash;
      const sameUser = row.recipient_id_hash === senderHash;
      if (!sameRoute && !sameAddress && !sameUser) return null;
      this.db
        .query("DELETE FROM messaging_imessage_tokens WHERE hash = ?")
        .run(hash);
      return {
        hash: row.hash,
        githubLogin: row.github_login,
        addressHash: row.address_hash,
        routeHash: row.route_hash,
        ...(row.recipient_id_hash
          ? { recipientIdHash: row.recipient_id_hash }
          : {}),
        ...(row.line_hash ? { lineHash: row.line_hash } : {}),
        encryptedAddress: row.address_cipher,
        expiresAt: row.expires_at,
      };
    })();
  }

  putLink(link: LinkRecord): void {
    this.db.transaction(() => {
      this.db
        .query(`DELETE FROM messaging_imessage_links
        WHERE github_login = ? OR sender_hash = ? OR address_hash = ?`)
        .run(link.githubLogin.toLowerCase(), link.senderHash, link.addressHash);
      this.db
        .query("INSERT INTO messaging_imessage_links VALUES(?, ?, ?, ?, ?, ?)")
        .run(
          link.senderHash,
          link.addressHash,
          link.githubLogin.toLowerCase(),
          link.encryptedAddress,
          link.encryptedChatId,
          link.encryptedLinePhone ?? null,
        );
    })();
  }

  getLinkByGithub(login: string): LinkRecord | null {
    const row = this.db
      .query("SELECT * FROM messaging_imessage_links WHERE github_login = ?")
      .get(login.toLowerCase()) as LinkRow | null;
    return linkRecord(row);
  }

  getLinkBySender(
    senderHash: string,
    addressHash: string | null,
  ): LinkRecord | null {
    const bySender = this.db
      .query("SELECT * FROM messaging_imessage_links WHERE sender_hash = ?")
      .get(senderHash) as LinkRow | null;
    if (bySender || !addressHash) return linkRecord(bySender);
    const byAddress = this.db
      .query("SELECT * FROM messaging_imessage_links WHERE address_hash = ?")
      .get(addressHash) as LinkRow | null;
    return linkRecord(byAddress);
  }

  deleteLink(hash: string): void {
    this.db
      .query("DELETE FROM messaging_imessage_links WHERE sender_hash = ?")
      .run(hash);
    this.putPending(hash, null);
  }

  claimInbound(messageId: string): boolean {
    return (
      this.db
        .query("INSERT OR IGNORE INTO messaging_inbound VALUES(?)")
        .run(messageId).changes === 1
    );
  }

  reserveAlert(alert: AlertRecord): boolean {
    return (
      this.db
        .query("INSERT OR IGNORE INTO messaging_alerts VALUES(?, ?, ?, ?)")
        .run(
          alert.id,
          alert.githubLogin.toLowerCase(),
          alert.createdAt,
          JSON.stringify(alert),
        ).changes === 1
    );
  }

  getAlert(id: string): AlertRecord | null {
    const row = this.db
      .query("SELECT body FROM messaging_alerts WHERE id = ?")
      .get(id) as BodyRow | null;
    return row === null ? null : (JSON.parse(row.body) as AlertRecord);
  }

  putAlert(alert: AlertRecord): void {
    this.db
      .query("UPDATE messaging_alerts SET body = ? WHERE id = ?")
      .run(JSON.stringify(alert), alert.id);
  }

  listAlerts(login: string): readonly AlertRecord[] {
    const rows = this.db
      .query(
        "SELECT body FROM messaging_alerts WHERE github_login = ? ORDER BY created_at DESC",
      )
      .all(login.toLowerCase()) as BodyRow[];
    return rows.map((row) => JSON.parse(row.body) as AlertRecord);
  }

  findCorrection(repo: string, commitSha: string): AlertRecord | null {
    const rows = this.db
      .query("SELECT body FROM messaging_alerts")
      .all() as BodyRow[];
    return (
      rows
        .map((row) => JSON.parse(row.body) as AlertRecord)
        .find(
          (item) =>
            item.repo === repo &&
            item.correctionCommitSha === commitSha &&
            item.state === "fixing",
        ) ?? null
    );
  }

  isIgnored(repo: string, claimId: string): boolean {
    return (
      this.db
        .query(
          "SELECT 1 AS found FROM messaging_ignored WHERE repo = ? AND claim_id = ?",
        )
        .get(repo, claimId) !== null
    );
  }

  ignore(repo: string, claimId: string): void {
    this.db
      .query("INSERT OR IGNORE INTO messaging_ignored VALUES(?, ?)")
      .run(repo, claimId);
  }

  getPending(hash: string): PendingChoice | null {
    const row = this.db
      .query(
        "SELECT body FROM messaging_imessage_pending WHERE sender_hash = ?",
      )
      .get(hash) as BodyRow | null;
    return row === null ? null : (JSON.parse(row.body) as PendingChoice);
  }

  putPending(hash: string, choice: PendingChoice | null): void {
    if (choice === null) {
      this.db
        .query("DELETE FROM messaging_imessage_pending WHERE sender_hash = ?")
        .run(hash);
      return;
    }
    this.db
      .query(`INSERT INTO messaging_imessage_pending VALUES(?, ?)
      ON CONFLICT(sender_hash) DO UPDATE SET body = excluded.body`)
      .run(hash, JSON.stringify(choice));
  }

  putOwnedClaims(login: string, run: RunRecord): void {
    const insert =
      this.db.query(`INSERT INTO messaging_owned_claims VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(github_login, claim_id, repo) DO UPDATE SET run_id = excluded.run_id, at = excluded.at`);
    for (const item of run.results) {
      insert.run(
        login.toLowerCase(),
        item.claimId,
        run.repo,
        run.id,
        run.createdAt,
      );
    }
  }

  findOwnedClaim(login: string, claimId: string): OwnedClaim | null {
    const row = this.db
      .query(`SELECT github_login, claim_id, repo, run_id, at
      FROM messaging_owned_claims WHERE github_login = ? AND claim_id = ? ORDER BY at DESC LIMIT 1`)
      .get(login.toLowerCase(), claimId) as {
      github_login: string;
      claim_id: string;
      repo: string;
      run_id: string;
      at: string;
    } | null;
    return row === null
      ? null
      : {
          githubLogin: row.github_login,
          claimId: row.claim_id,
          repo: row.repo,
          runId: row.run_id,
          at: row.at,
        };
  }
}
