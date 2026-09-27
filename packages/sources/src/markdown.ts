import type { RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { DocSpan, DocText, Location, Source } from "./index.ts";

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let offset = 0; offset < text.length; offset += 1) {
    if (text[offset] === "\n") starts.push(offset + 1);
  }
  return starts;
}

function lineAt(starts: readonly number[], offset: number): number {
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if ((starts[middle] ?? 0) <= offset) low = middle;
    else high = middle;
  }
  return low + 1;
}

function locationFor(
  source: Extract<Source, { kind: "readme" | "docs" | "wiki" }>,
  start: number,
  end: number,
  starts: readonly number[],
  headings: readonly string[],
): Location {
  if (source.kind === "wiki") {
    return {
      kind: "wiki",
      sourceId: source.id,
      page: source.page,
      url: source.url,
      headingPath: [...headings],
      startOffset: start,
      endOffset: end,
    };
  }
  return {
    kind: "file",
    sourceId: source.id,
    path: source.path,
    lineStart: lineAt(starts, start),
    lineEnd: lineAt(starts, end - 1),
    startOffset: start,
    endOffset: end,
  };
}

function headingValue(markdown: string, start: number, end: number): string {
  return markdown
    .slice(start, end)
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\s*#+\s*$/, "")
    .trim();
}

function spanFor(
  source: Extract<Source, { kind: "readme" | "docs" | "wiki" }>,
  node: RootContent,
  starts: readonly number[],
  headings: readonly string[],
): DocSpan | null {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined || end <= start) return null;
  const base = {
    startOffset: start,
    endOffset: end,
    location: locationFor(source, start, end, starts, headings),
  };
  if (node.type === "heading")
    return { ...base, kind: "heading", level: node.depth };
  if (node.type === "code")
    return { ...base, kind: "code", language: node.lang ?? null };
  return { ...base, kind: "text" };
}

export function markdownToDocText(
  source: Extract<Source, { kind: "readme" | "docs" | "wiki" }>,
  markdown: string,
): DocText {
  const starts = lineStarts(markdown);
  const headings: string[] = [];
  const spans: DocSpan[] = [];
  for (const node of fromMarkdown(markdown).children) {
    if (node.type === "heading") {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start !== undefined && end !== undefined) {
        headings.length = node.depth - 1;
        headings[node.depth - 1] = headingValue(markdown, start, end);
      }
    }
    const span = spanFor(source, node, starts, headings.filter(Boolean));
    if (span) spans.push(span);
  }
  return { sourceId: source.id, text: markdown, spans };
}
