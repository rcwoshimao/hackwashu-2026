import type { Root, RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

export type CandidateSignal =
  | "shell_command"
  | "inline_code"
  | "localhost_url"
  | "env_var"
  | "version"
  | "http_example";

export interface Candidate {
  signal: CandidateSignal;
  quote: string;
  lineStart: number;
  lineEnd: number;
  startOffset: number;
  endOffset: number;
}

type MarkdownNode = Root | RootContent;
type Span = { start: number; end: number };
type ScanContext = {
  markdown: string;
  lineStarts: number[];
  output: Candidate[];
};

const shellLanguages = new Set([
  "bash",
  "console",
  "fish",
  "ps1",
  "powershell",
  "sh",
  "shell",
  "zsh",
]);

const patterns: ReadonlyArray<[CandidateSignal, RegExp]> = [
  ["localhost_url", /\b(?:https?:\/\/)?localhost:\d{1,5}(?:\/[\w./?=&%~-]*)?/g],
  [
    "env_var",
    /\b(?:process\.env\.[A-Z][A-Z0-9_]*|import\.meta\.env\.[A-Z][A-Z0-9_]*|[A-Z][A-Z0-9_]*_[A-Z0-9_]+|PORT)\b|\bprocess\.env\[["'][A-Z][A-Z0-9_]*["']\]/g,
  ],
  [
    "version",
    /\b(?:Node(?:\.js)?|Bun|npm)[ \t]*(?:v(?:ersion)?[ \t]*)?(?:>=|>|=|\^|~)?[ \t]*\d+(?:\.\d+){0,2}(?:\+|[ \t]+or[ \t]+(?:newer|later))?/gi,
  ],
  [
    "http_example",
    /\bcurl\b[^\r\n]*|\b(?:GET|POST|PUT|PATCH|DELETE)[ \t]+\/[^\s`"<>]+/g,
  ],
];

function spanOf(node: MarkdownNode): Span | undefined {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined || end <= start)
    return undefined;
  return { start, end };
}

function indexLines(markdown: string): number[] {
  const starts = [0];
  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function lineAt(starts: number[], offset: number): number {
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if ((starts[middle] ?? 0) <= offset) low = middle;
    else high = middle;
  }
  return low + 1;
}

function addCandidate(
  context: ScanContext,
  signal: CandidateSignal,
  start: number,
  end: number,
): void {
  const quote = context.markdown.slice(start, end);
  if (quote.length === 0) return;
  context.output.push({
    signal,
    quote,
    lineStart: lineAt(context.lineStarts, start),
    lineEnd: lineAt(context.lineStarts, end - 1),
    startOffset: start,
    endOffset: end,
  });
}

function scanPatterns(context: ScanContext, span: Span): void {
  const source = context.markdown.slice(span.start, span.end);
  for (const [signal, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) {
      const start = span.start + match.index;
      const quote =
        signal === "localhost_url" ? match[0].replace(/[.,;]+$/, "") : match[0];
      addCandidate(context, signal, start, start + quote.length);
    }
  }
}

function scanShellLines(
  context: ScanContext,
  span: Span,
  language: string | null | undefined,
): void {
  const shell =
    language !== null &&
    language !== undefined &&
    shellLanguages.has(language.toLowerCase());
  const plainText = language === "text" || language === "plaintext";
  if (language && !shell && !plainText) return;
  const source = context.markdown.slice(span.start, span.end);
  for (const match of source.matchAll(/[^\r\n]+/g)) {
    const line = match[0];
    if (/^\s*(?:\x60{3,}|~{3,}|#)/.test(line)) continue;
    if (
      !shell &&
      !/^\s*(?:\$\s*)?(?:npm|pnpm|yarn|bun|node|npx|cp|mkdir|touch|curl)\b/.test(
        line,
      )
    )
      continue;
    const prompt = /^\s*(?:\$\s+)?/.exec(line)?.[0].length ?? 0;
    const start = span.start + match.index + prompt;
    const end = span.start + match.index + line.trimEnd().length;
    addCandidate(context, "shell_command", start, end);
  }
}

function scanInlineCode(
  context: ScanContext,
  node: Extract<RootContent, { type: "inlineCode" }>,
): void {
  const span = spanOf(node);
  if (!span) return;
  const source = context.markdown.slice(span.start, span.end);
  const inner = source.indexOf(node.value);
  if (inner >= 0 && node.value.length > 0) {
    addCandidate(
      context,
      "inline_code",
      span.start + inner,
      span.start + inner + node.value.length,
    );
  } else {
    addCandidate(context, "inline_code", span.start, span.end);
  }
}

function scanNode(context: ScanContext, node: MarkdownNode): void {
  const span = spanOf(node);
  if (span && node.type === "code") scanShellLines(context, span, node.lang);
  if (node.type === "inlineCode") scanInlineCode(context, node);
  if (
    span &&
    (node.type === "text" ||
      node.type === "inlineCode" ||
      node.type === "code" ||
      node.type === "link")
  ) {
    scanPatterns(context, span);
  }
  if ("children" in node) {
    for (const child of node.children as MarkdownNode[])
      scanNode(context, child);
  }
}

export function extractCandidates(markdown: string): Candidate[] {
  const context: ScanContext = {
    markdown,
    lineStarts: indexLines(markdown),
    output: [],
  };
  scanNode(context, fromMarkdown(markdown));
  const distinct = new Map<string, Candidate>();
  for (const item of context.output) {
    distinct.set(`${item.signal}:${item.startOffset}:${item.endOffset}`, item);
  }
  return [...distinct.values()].sort(
    (left, right) =>
      left.startOffset - right.startOffset ||
      left.endOffset - right.endOffset ||
      left.signal.localeCompare(right.signal),
  );
}
