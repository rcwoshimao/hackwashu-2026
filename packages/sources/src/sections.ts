import { createHash } from "node:crypto";
import type { DocText } from "./index.ts";

export type DocSection = {
  id: string;
  headingPath: readonly string[];
  startOffset: number;
  endOffset: number;
  hash: string;
  text: string;
};

function normalized(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .trim();
}

export function sourceTextHash(text: string): string {
  return createHash("sha256").update(normalized(text)).digest("hex");
}

export function splitSections(doc: DocText): DocSection[] {
  const headings = doc.spans.filter((span) => span.kind === "heading");
  const starts =
    headings.length > 0
      ? [0, ...headings.map((span) => span.startOffset)]
      : [0];
  const uniqueStarts = [...new Set(starts)].filter(
    (start) => start < doc.text.length,
  );
  const sections: DocSection[] = [];
  const path: string[] = [];
  for (const [index, startOffset] of uniqueStarts.entries()) {
    const endOffset = uniqueStarts[index + 1] ?? doc.text.length;
    const heading = headings.find((span) => span.startOffset === startOffset);
    if (heading?.kind === "heading") {
      path.length = heading.level - 1;
      path[heading.level - 1] = doc.text
        .slice(heading.startOffset, heading.endOffset)
        .trim();
    }
    const text = doc.text.slice(startOffset, endOffset);
    sections.push({
      id: `${doc.sourceId}:${index}`,
      headingPath: path.filter(Boolean),
      startOffset,
      endOffset,
      text,
      hash: sourceTextHash(text),
    });
  }
  return sections;
}
