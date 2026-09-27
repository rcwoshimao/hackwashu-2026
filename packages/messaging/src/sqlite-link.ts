import type { LinkRecord } from "./types.ts";

export type TokenRow = {
  hash: string;
  github_login: string;
  address_hash: string;
  route_hash: string;
  recipient_id_hash: string | null;
  line_hash: string | null;
  address_cipher: string;
  expires_at: number;
};

export type LinkRow = {
  github_login: string;
  sender_hash: string;
  address_hash: string;
  address_cipher: string;
  chat_cipher: string;
  line_cipher: string | null;
};

export function linkRecord(row: LinkRow | null): LinkRecord | null {
  return row === null
    ? null
    : {
        githubLogin: row.github_login,
        senderHash: row.sender_hash,
        addressHash: row.address_hash,
        encryptedAddress: row.address_cipher,
        encryptedChatId: row.chat_cipher,
        ...(row.line_cipher ? { encryptedLinePhone: row.line_cipher } : {}),
      };
}
