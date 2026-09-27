import type { ModelInput, ModelPort, ProposedCheck, Result } from "./types.ts";

function lineFor(section: string, quote: string): string {
  const at = section.indexOf(quote);
  if (at < 0) return quote;
  const start = section.lastIndexOf("\n", at - 1) + 1;
  const next = section.indexOf("\n", at);
  return section.slice(start, next < 0 ? undefined : next).trim();
}

function scriptFromCommand(quote: string): string | null {
  const match = /^(?:npm|pnpm|yarn|bun)\s+(?:(run)\s+)?([\w:-]+)/.exec(quote);
  if (!match) return null;
  const script = match[2];
  if (
    !script ||
    (match[1] === undefined &&
      ["install", "ci", "add", "remove", "exec"].includes(script))
  )
    return null;
  return script;
}

function versionCheck(quote: string): ProposedCheck | null {
  const match =
    /\b(?:Node(?:\.js)?|Bun|npm)\s*(?:v(?:ersion)?\s*)?((?:>=|>|=|\^|~)?\s*\d+(?:\.\d+){0,2})(\+|\s+or\s+(?:newer|later))?/i.exec(
      quote,
    );
  if (!match?.[1]) return null;
  const raw = match[1].replaceAll(" ", "");
  const range = match[2] && /^\d/.test(raw) ? `>=${raw}` : raw;
  return { kind: "version", params: { range }, quote };
}

function codeReference(input: ModelInput, name: string): ProposedCheck | null {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return null;
  const line = lineFor(input.sectionText, name);
  const at = line.indexOf(name);
  if (at < 0) return null;
  const verbs = [
    ...line.slice(0, at).matchAll(/\b(exports?|reads?|uses?|sets?|takes?)\b/gi),
  ];
  if (!/^exports?$/i.test(verbs.at(-1)?.[0] ?? "")) return null;
  return { kind: "code_reference", params: { name }, quote: name };
}

function inlineChecks(input: ModelInput, quote: string): ProposedCheck[] {
  const checks: ProposedCheck[] = [];
  const line = lineFor(input.sectionText, quote);
  if (/^(?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]+$/.test(quote))
    checks.push({ kind: "file_exists", params: { path: quote }, quote });
  if (/^[\w:-]+$/.test(quote) && /\bscript\b/i.test(line))
    checks.push({
      kind: "script_exists",
      params: { script: quote },
      quote: line,
    });
  const reference = codeReference(input, quote);
  if (reference) checks.push(reference);
  const flag = /--?[A-Za-z][A-Za-z0-9-]*/.exec(quote)?.[0];
  if (flag) checks.push({ kind: "cli_flag", params: { flag }, quote });
  return checks;
}

function environmentCheck(quote: string): ProposedCheck | null {
  const name =
    /(?:process|import\.meta)\.env(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\])/
      .exec(quote)
      ?.slice(1)
      .find(Boolean) ?? quote;
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) return null;
  return { kind: "env_var", params: { name }, quote };
}

export function heuristicChecks(input: ModelInput): ProposedCheck[] {
  const checks: ProposedCheck[] = [];
  for (const candidate of input.candidates) {
    if (candidate.signal === "inline_code")
      checks.push(...inlineChecks(input, candidate.quote));
    if (["shell_command", "inline_code"].includes(candidate.signal)) {
      const script = scriptFromCommand(candidate.quote);
      if (script)
        checks.push({
          kind: "script_exists",
          params: { script },
          quote: candidate.quote,
        });
    }
    if (candidate.signal === "version") {
      const check = versionCheck(candidate.quote);
      if (check) checks.push(check);
    }
    if (candidate.signal === "env_var") {
      const check = environmentCheck(candidate.quote);
      if (check) checks.push(check);
    }
  }
  return checks;
}

export class HeuristicModel implements ModelPort {
  readonly model = "local-static";
  async extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>> {
    return { ok: true, value: heuristicChecks(input) };
  }
}
