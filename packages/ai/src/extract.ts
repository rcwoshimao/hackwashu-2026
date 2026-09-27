import { createHash } from "node:crypto";
import { extractCandidates } from "@ground-control/claims";
import {
  type Claim,
  checkSchema,
  claimId,
  type FlightPlan,
  flightPlanSchema,
} from "@ground-control/plan";
import {
  type DocSection,
  type DocText,
  quoteInLocation,
  sourceTextHash,
  splitSections,
} from "@ground-control/sources";
import type {
  ModelCache,
  ModelInput,
  ModelPort,
  ProposedCheck,
  Result,
} from "./types.ts";

const promptVersion = "extract-v1";

export type Extraction = {
  plan: FlightPlan;
  sections: number;
  modelCalls: number;
  rejected: number;
};

function inputFor(section: DocSection): ModelInput {
  return {
    sectionText: section.text,
    candidates: extractCandidates(section.text).map(({ signal, quote }) => ({
      signal,
      quote,
    })),
  };
}

function cacheKey(model: string, input: ModelInput): string {
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return `${promptVersion}:${model}:${hash}`;
}

async function proposalsFor(
  section: DocSection,
  model: ModelPort,
  cache: ModelCache,
): Promise<Result<{ claims: readonly ProposedCheck[]; called: boolean }>> {
  const input = inputFor(section);
  const key = cacheKey(model.model, input);
  const cached = cache.get(key);
  if (cached) return { ok: true, value: { claims: cached, called: false } };
  const answer = await model.extract(input);
  if (!answer.ok) return answer;
  cache.set(key, answer.value);
  return { ok: true, value: { claims: answer.value, called: true } };
}

function quoteLocations(
  doc: DocText,
  section: DocSection,
  quote: string,
  codeOnly: boolean,
): Claim["occurrences"] {
  const occurrences: Claim["occurrences"] = [];
  if (!quote) return occurrences;
  let from = 0;
  while (from < section.text.length) {
    const local = section.text.indexOf(quote, from);
    if (local < 0) break;
    const start = section.startOffset + local;
    const end = start + quote.length;
    const span = doc.spans.find(
      (item) => item.startOffset <= start && item.endOffset >= end,
    );
    if (span && (!codeOnly || span.kind === "code")) {
      const location = { ...span.location, startOffset: start, endOffset: end };
      if (quoteInLocation(doc, location, quote))
        occurrences.push({ quote, location });
    }
    from = local + quote.length;
  }
  return occurrences;
}

function safeClaim(
  doc: DocText,
  section: DocSection,
  proposal: ProposedCheck,
): Claim | null {
  const check = checkSchema.safeParse(proposal);
  if (!check.success) return null;
  const command = check.data.kind === "command_succeeds";
  const occurrences = quoteLocations(doc, section, proposal.quote, command);
  if (occurrences.length === 0) return null;
  if (check.data.kind === "command_succeeds") {
    if (!proposal.quote.includes(check.data.params.command)) return null;
  }
  const tier = ["command_succeeds", "port_listens", "http_example"].includes(
    check.data.kind,
  )
    ? ("runtime" as const)
    : ("static" as const);
  return {
    ...check.data,
    tier,
    id: claimId(
      doc.sourceId,
      proposal.quote,
      check.data.kind,
      check.data.params,
    ),
    sourceId: doc.sourceId,
    occurrences,
  };
}

function mergeClaims(claims: readonly Claim[]): Claim[] {
  const merged = new Map<string, Claim>();
  for (const claim of claims) {
    const existing = merged.get(claim.id);
    if (!existing) merged.set(claim.id, claim);
    else {
      const occurrences = [...existing.occurrences, ...claim.occurrences];
      merged.set(claim.id, { ...existing, occurrences });
    }
  }
  return [...merged.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

export async function extractFlightPlan(
  repo: string,
  docs: readonly DocText[],
  model: ModelPort,
  cache: ModelCache,
): Promise<Result<Extraction>> {
  const claims: Claim[] = [];
  let sections = 0;
  let modelCalls = 0;
  let rejected = 0;
  for (const doc of docs) {
    for (const section of splitSections(doc)) {
      sections += 1;
      const answer = await proposalsFor(section, model, cache);
      if (!answer.ok) return answer;
      if (answer.value.called) modelCalls += 1;
      for (const proposal of answer.value.claims) {
        const claim = safeClaim(doc, section, proposal);
        if (claim) claims.push(claim);
        else rejected += 1;
      }
    }
  }
  const plan = flightPlanSchema.safeParse({
    repo,
    sourceHashes: Object.fromEntries(
      docs.map((doc) => [doc.sourceId, sourceTextHash(doc.text)]),
    ),
    claims: mergeClaims(claims),
  });
  return plan.success
    ? { ok: true, value: { plan: plan.data, sections, modelCalls, rejected } }
    : { ok: false, error: { code: "invalid_response" } };
}

export function heuristicChecks(input: ModelInput): ProposedCheck[] {
  const checks: ProposedCheck[] = [];
  for (const candidate of input.candidates) {
    if (
      candidate.signal === "shell_command" ||
      candidate.signal === "inline_code"
    ) {
      const script = /^(?:npm|pnpm|yarn|bun) run ([\w:-]+)/.exec(
        candidate.quote,
      )?.[1];
      if (script)
        checks.push({
          kind: "script_exists",
          params: { script },
          quote: candidate.quote,
        });
    }
    if (candidate.signal === "version") {
      const range =
        /(?:Node(?:\.js)?|Bun|npm)\s*(?:v(?:ersion)?\s*)?([^\s]+)/i.exec(
          candidate.quote,
        )?.[1];
      if (range && /\d/.test(range))
        checks.push({
          kind: "version",
          params: { range },
          quote: candidate.quote,
        });
    }
    if (
      candidate.signal === "inline_code" &&
      /^(?:[\w.-]+\/)+[\w.-]+\.[A-Za-z0-9]+$/.test(candidate.quote)
    )
      checks.push({
        kind: "file_exists",
        params: { path: candidate.quote },
        quote: candidate.quote,
      });
  }
  return checks;
}

export class HeuristicModel implements ModelPort {
  readonly model = "local-static";
  async extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>> {
    return { ok: true, value: heuristicChecks(input) };
  }
}
