import { locationSchema, sourceKindSchema } from "@ground-control/sources";
import { z } from "zod";
import { checkSchema } from "./checks";
import { claimId, factKey } from "./identity";

const idSchema = z.string().min(1);
const shaSchema = z.string().regex(/^[0-9a-f]{7,64}$/);
const twentyLinesSchema = z
  .string()
  .refine((value) => value.split(/\r?\n/).length <= 20);

export const claimSchema = z
  .intersection(
    checkSchema,
    z.object({
      id: z.string().regex(/^c_[0-9a-f]{10}$/),
      sourceId: idSchema,
      occurrences: z
        .array(z.object({ quote: idSchema, location: locationSchema }))
        .min(1),
      tier: z.enum(["static", "runtime"]),
    }),
  )
  .superRefine((claim, context) => {
    for (const [index, occurrence] of claim.occurrences.entries()) {
      if (
        claim.id !==
        claimId(claim.sourceId, occurrence.quote, claim.kind, claim.params)
      ) {
        context.addIssue({
          code: "custom",
          path: ["occurrences", index, "quote"],
          message: "Claim ID does not match occurrence quote",
        });
      }
      if (occurrence.location.sourceId !== claim.sourceId) {
        context.addIssue({
          code: "custom",
          path: ["occurrences", index, "location"],
          message: "Occurrence location must use claim source ID",
        });
      }
    }
    const runtime = [
      "command_succeeds",
      "port_listens",
      "http_example",
    ].includes(claim.kind);
    if (
      claim.kind !== "cli_flag" &&
      claim.tier !== (runtime ? "runtime" : "static")
    ) {
      context.addIssue({
        code: "custom",
        path: ["tier"],
        message: "Tier does not match check kind",
      });
    }
  });

export const flightPlanSchema = z
  .object({
    repo: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
    sourceHashes: z.record(z.string(), z.string().regex(/^[0-9a-f]{64}$/)),
    claims: z.array(claimSchema),
  })
  .superRefine((plan, context) => {
    const seen = new Set<string>();
    for (const [index, claim] of plan.claims.entries()) {
      if (seen.has(claim.id)) {
        context.addIssue({
          code: "custom",
          path: ["claims", index, "id"],
          message: "Duplicate claim ID; merge occurrences",
        });
      }
      seen.add(claim.id);
      if (!(claim.sourceId in plan.sourceHashes)) {
        context.addIssue({
          code: "custom",
          path: ["claims", index, "sourceId"],
          message: "Claim source has no content hash",
        });
      }
    }
  });

export const trustStateSchema = z.enum([
  "unconfirmed",
  "confirmed",
  "disputed",
  "dropped",
]);

export const claimEvidenceSchema = z
  .object({
    claimId: z.string().regex(/^c_[0-9a-f]{10}$/),
    sourceId: idSchema,
    sourceKind: sourceKindSchema,
    location: locationSchema,
    quote: idSchema,
    expected: z.string(),
    actual: twentyLinesSchema,
    lastPassSha: shaSchema.nullable(),
    firstFailSha: shaSchema,
    relatedFiles: z.array(z.string()),
    suspectedCommit: z
      .object({ sha: shaSchema, author: z.string().nullable() })
      .nullable(),
    deepLink: z.url(),
    fix: z.object({
      kind: z.enum(["pr", "wiki_patch", "confluence_comment", "evidence_only"]),
      url: z.url().optional(),
      suggestedText: z.string().optional(),
    }),
  })
  .superRefine((item, context) => {
    if (item.location.sourceId !== item.sourceId) {
      context.addIssue({
        code: "custom",
        path: ["location"],
        message: "Evidence location must use its source ID",
      });
    }
  });

export const evidenceSchema = z
  .intersection(
    checkSchema,
    z.object({
      factKey: idSchema,
      claims: z.array(claimEvidenceSchema).min(1),
    }),
  )
  .superRefine((evidence, context) => {
    if (evidence.factKey !== factKey(evidence.kind, evidence.params)) {
      context.addIssue({
        code: "custom",
        path: ["factKey"],
        message: "Fact key does not match kind and parameters",
      });
    }
  });

export type Claim = z.infer<typeof claimSchema>;
export type FlightPlan = z.infer<typeof flightPlanSchema>;
export type TrustState = z.infer<typeof trustStateSchema>;
export type ClaimEvidence = z.infer<typeof claimEvidenceSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
