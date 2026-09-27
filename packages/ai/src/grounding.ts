import type { Check } from "@ground-control/plan";

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namedInQuote(quote: string, name: string): boolean {
  return new RegExp(
    `(?:^|[^A-Za-z0-9_$])${escaped(name)}(?=$|[^A-Za-z0-9_$])`,
  ).test(quote);
}

function pathInQuote(quote: string, path: string): boolean {
  return new RegExp(
    `(?:^|[^A-Za-z0-9._/-])${escaped(path)}(?=$|[^A-Za-z0-9._/-])`,
  ).test(quote);
}

function versionInQuote(quote: string, range: string): boolean {
  const numbers = range.match(/\d+(?:\.\d+)*/g) ?? [];
  if (
    numbers.length === 0 ||
    numbers.some(
      (number) =>
        !new RegExp(`(?:^|[^0-9.])${escaped(number)}(?=$|[^0-9.])`).test(quote),
    )
  )
    return false;
  if (/^\d+(?:\.\d+)*$/.test(range))
    return (
      quote.includes(range) &&
      !/(?:[><=^~]\s*\d|\d\+|or\s+(?:newer|later))/i.test(quote)
    );
  if (quote.includes(range)) return true;
  const minimum = /^>=(\d+(?:\.\d+)*)$/.exec(range)?.[1];
  return (
    minimum !== undefined &&
    new RegExp(
      `${escaped(minimum)}(?:\\+|\\s+or\\s+(?:newer|later))`,
      "i",
    ).test(quote)
  );
}

function scriptInQuote(quote: string, script: string): boolean {
  const name = escaped(script);
  const prose = new RegExp(
    `(?:\\x60${name}\\x60|\\b${name}\\b)\\s+script\\b`,
    "i",
  );
  if (prose.test(quote)) return true;
  const builtins = new Set(["install", "ci", "add", "remove", "exec", "run"]);
  for (const match of quote.matchAll(
    /\b(?:npm|pnpm|yarn|bun)\s+(?:(run)\s+)?([\w:-]+)/g,
  )) {
    if (
      match[2] === script &&
      (match[1] !== undefined || !builtins.has(script))
    )
      return true;
  }
  return false;
}

export function groundedParameters(
  check: Check,
  quote: string,
  sectionText: string,
): boolean {
  switch (check.kind) {
    case "file_exists":
      return pathInQuote(quote, check.params.path);
    case "script_exists":
      return scriptInQuote(quote, check.params.script);
    case "code_reference":
      return namedInQuote(quote, check.params.name);
    case "env_var":
      return namedInQuote(quote, check.params.name);
    case "version":
      return versionInQuote(quote, check.params.range);
    case "cli_flag":
      return quote.includes(check.params.flag);
    case "command_succeeds":
      return quote.includes(check.params.command);
    case "port_listens":
      return (
        namedInQuote(quote, String(check.params.port)) &&
        scriptInQuote(sectionText, check.params.startScript)
      );
    case "http_example":
      return (
        quote.includes(check.params.method) &&
        quote.includes(check.params.path) &&
        namedInQuote(quote, String(check.params.expectedStatus)) &&
        check.params.expectedKeys.every((key) => namedInQuote(quote, key))
      );
  }
}
