import { type DocText, quoteInLocation } from "@ground-control/sources";
import type { Claim } from "./schema";

export function claimGroundedInDocText(claim: Claim, doc: DocText): boolean {
  if (claim.sourceId !== doc.sourceId) return false;
  return claim.occurrences.every(({ quote, location }) =>
    quoteInLocation(doc, location, quote),
  );
}
