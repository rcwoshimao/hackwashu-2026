import { createHash } from "node:crypto";
import type { FlightPlan } from "@ground-control/plan";
import { claimId, flightPlanSchema } from "@ground-control/plan";
import type { FileChange, FixResult } from "./types.ts";

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function mappedRange(
  start: number,
  end: number,
  file: FileChange,
): { start: number; end: number; touched: boolean } | null {
  const overlaps = file.edits.filter(
    (edit) => edit.startOffset < end && edit.endOffset > start,
  );
  if (overlaps.some((edit) => edit.startOffset < start || edit.endOffset > end))
    return null;
  const before = file.edits
    .filter((edit) => edit.endOffset <= start)
    .reduce(
      (sum, edit) =>
        sum + edit.replacement.length - (edit.endOffset - edit.startOffset),
      0,
    );
  const inside = overlaps.reduce(
    (sum, edit) =>
      sum + edit.replacement.length - (edit.endOffset - edit.startOffset),
    0,
  );
  return {
    start: start + before,
    end: end + before + inside,
    touched: overlaps.length > 0,
  };
}

function rebaseOccurrence(
  occurrence: FlightPlan["claims"][number]["occurrences"][number],
  file: FileChange,
): boolean | null {
  const location = occurrence.location;
  if (location.kind !== "file" || location.path !== file.path) return false;
  if (
    file.before.slice(location.startOffset, location.endOffset) !==
    occurrence.quote
  )
    return null;
  const mapped = mappedRange(location.startOffset, location.endOffset, file);
  if (!mapped) return null;
  location.startOffset = mapped.start;
  location.endOffset = mapped.end;
  occurrence.quote = file.after.slice(mapped.start, mapped.end);
  return mapped.touched;
}

export function rebaseFlightPlan(
  original: FlightPlan,
  files: readonly FileChange[],
  newPort: number,
): FixResult<FlightPlan> {
  const plan = structuredClone(original);
  for (const file of files) {
    const sourceIds = new Set(
      plan.claims.flatMap((claim) =>
        claim.occurrences.some(
          (item) =>
            item.location.kind === "file" && item.location.path === file.path,
        )
          ? [claim.sourceId]
          : [],
      ),
    );
    for (const id of sourceIds) {
      if (plan.sourceHashes[id] !== hash(file.before))
        return { ok: false, error: { code: "stale_plan" } };
      plan.sourceHashes[id] = hash(file.after);
    }
    for (const claim of plan.claims) {
      let touched = false;
      for (const occurrence of claim.occurrences) {
        const result = rebaseOccurrence(occurrence, file);
        if (result === null)
          return { ok: false, error: { code: "stale_plan" } };
        touched ||= result;
      }
      if (touched && claim.kind === "port_listens") claim.params.port = newPort;
      const first = claim.occurrences[0];
      if (!first) return { ok: false, error: { code: "stale_plan" } };
      claim.id = claimId(claim.sourceId, first.quote, claim.kind, claim.params);
    }
  }
  const parsed = flightPlanSchema.safeParse(plan);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: { code: "stale_plan" } };
}
