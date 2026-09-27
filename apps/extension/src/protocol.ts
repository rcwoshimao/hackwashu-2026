import { z } from "zod";

export const claimSchema = z.object({
  id: z.string(),
  quote: z.string(),
  state: z.enum(["verified", "drifting", "unconfirmed", "disputed"]),
  deepLink: z.string().nullable(),
  tooltip: z.string(),
});

export const pageClaimsSchema = z.object({
  known: z.boolean(),
  canCheck: z.boolean(),
  repo: z.string().optional(),
  claims: z.array(claimSchema),
});

export const meSchema = z.object({
  signedIn: z.boolean(),
  login: z.string().optional(),
  connectedRepos: z.array(z.string()),
});

export const repoSchema = z.object({
  repo: z.string(),
  label: z.string(),
  driftDegrees: z.number(),
});

export const actionSchema = z.object({}).passthrough();

export type PageClaims = z.infer<typeof pageClaimsSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type Me = z.infer<typeof meSchema>;
export type Repo = z.infer<typeof repoSchema>;

export type ContentMessage = { kind: "page-claims"; url: string };
export type ContentReply =
  | { ok: true; value: PageClaims }
  | { ok: false; error: "network" | "server" | "invalid" };
