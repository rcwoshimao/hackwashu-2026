import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { DocSpan, DocText, Location, Source } from "./index.ts";

type HtmlSource = Extract<Source, { kind: "confluence" | "url" }>;
type Block = {
  kind: "heading" | "text" | "code";
  text: string;
  level: number;
  headingPath: string[];
};

function blockText(element: Element, preserveLines: boolean): string {
  const text = element.textContent ?? "";
  return preserveLines
    ? text.replace(/\r\n/g, "\n").trim()
    : text.replace(/\s+/g, " ").trim();
}

function blockKind(element: Element): Block["kind"] | null {
  const tag = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return "heading";
  if (tag === "pre") return "code";
  if (tag === "p" || tag === "li") return "text";
  if (
    tag === "ac:structured-macro" &&
    element.getAttribute("ac:name") === "code"
  )
    return "code";
  return null;
}

function nestedBlock(element: Element): boolean {
  let parent = element.parentElement;
  while (parent) {
    if (blockKind(parent) !== null) return true;
    parent = parent.parentElement;
  }
  return false;
}

function codeText(element: Element): string {
  if (element.tagName.toLowerCase() !== "ac:structured-macro")
    return blockText(element, true);
  for (const child of Array.from(element.querySelectorAll("*"))) {
    if (child.tagName.toLowerCase() === "ac:plain-text-body")
      return blockText(child, true);
  }
  return blockText(element, true);
}

function collectBlocks(root: Element): Block[] {
  const blocks: Block[] = [];
  const headings: string[] = [];
  for (const element of Array.from(root.querySelectorAll("*"))) {
    const kind = blockKind(element);
    if (!kind || nestedBlock(element)) continue;
    const text =
      kind === "code" ? codeText(element) : blockText(element, false);
    if (!text) continue;
    const level = kind === "heading" ? Number(element.tagName[1]) : 0;
    if (kind === "heading") {
      headings.length = level - 1;
      headings[level - 1] = text;
    }
    blocks.push({ kind, text, level, headingPath: headings.filter(Boolean) });
  }
  return blocks;
}

function locationFor(
  source: HtmlSource,
  block: Block,
  startOffset: number,
  endOffset: number,
): Location {
  const base = {
    sourceId: source.id,
    url: source.url,
    headingPath: block.headingPath,
    startOffset,
    endOffset,
  };
  return source.kind === "confluence"
    ? { ...base, kind: "confluence", pageId: source.pageId }
    : { ...base, kind: "url" };
}

function toDocText(source: HtmlSource, blocks: readonly Block[]): DocText {
  let text = "";
  const spans: DocSpan[] = [];
  for (const block of blocks) {
    if (text) text += "\n";
    const startOffset = text.length;
    text += block.text;
    const endOffset = text.length;
    const base = {
      startOffset,
      endOffset,
      location: locationFor(source, block, startOffset, endOffset),
    };
    if (block.kind === "heading")
      spans.push({ ...base, kind: "heading", level: block.level });
    else if (block.kind === "code")
      spans.push({ ...base, kind: "code", language: null });
    else spans.push({ ...base, kind: "text" });
  }
  return { sourceId: source.id, text, spans };
}

export function confluenceToDocText(
  source: Extract<Source, { kind: "confluence" }>,
  storageHtml: string,
): DocText {
  const document = parseHTML(
    `<html><body>${storageHtml}</body></html>`,
  ).document;
  return toDocText(source, collectBlocks(document.body));
}

export function webPageToDocText(
  source: Extract<Source, { kind: "url" }>,
  html: string,
): DocText {
  const document = parseHTML(html).document;
  const article = new Readability(document as unknown as Document, {
    charThreshold: 0,
  }).parse();
  const selected = article?.content
    ? parseHTML(`<html><body>${article.content}</body></html>`).document.body
    : (document.querySelector("main,article") ?? document.body);
  return toDocText(source, collectBlocks(selected));
}
