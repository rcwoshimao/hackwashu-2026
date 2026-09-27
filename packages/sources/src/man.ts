import type { DocSpan, DocText, Source } from "./index.ts";

const supported = new Set(["TH", "SH", "SS", "PP", "TP", "B", "I", "BR", "IR"]);

function flattenRoff(value: string): string {
  return value
    .replace(/\\f(?:B|I|P|R)/g, "")
    .replace(/\\-/g, "-")
    .replace(/\\&/g, "")
    .replace(/\\\(em/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function macroLine(line: string): {
  text: string;
  kind: "heading" | "text" | "skip";
  level: number;
} {
  if (!line.startsWith("."))
    return { text: flattenRoff(line), kind: "text", level: 0 };
  const match = /^\.([A-Za-z]+)(?:\s+(.*))?$/.exec(line);
  if (!match) return { text: "", kind: "skip", level: 0 };
  const macro = match[1] ?? "";
  if (!supported.has(macro)) return { text: "", kind: "skip", level: 0 };
  if (macro === "TH" || macro === "PP" || macro === "TP")
    return { text: "", kind: "skip", level: 0 };
  const text = flattenRoff((match[2] ?? "").replace(/"/g, ""));
  if (macro === "SH" || macro === "SS")
    return { text, kind: "heading", level: macro === "SH" ? 1 : 2 };
  return { text, kind: "text", level: 0 };
}

export function manToDocText(
  source: Extract<Source, { kind: "man" }>,
  roff: string,
): DocText {
  const chunks: string[] = [];
  const spans: DocSpan[] = [];
  let offset = 0;
  for (const [index, line] of roff.split(/\r?\n/).entries()) {
    const rendered = macroLine(line);
    if (!rendered.text) continue;
    if (chunks.length > 0) offset += 1;
    const startOffset = offset;
    chunks.push(rendered.text);
    offset += rendered.text.length;
    const endOffset = offset;
    const base = {
      startOffset,
      endOffset,
      location: {
        kind: "file" as const,
        sourceId: source.id,
        path: source.path,
        lineStart: index + 1,
        lineEnd: index + 1,
        startOffset,
        endOffset,
      },
    };
    spans.push(
      rendered.kind === "heading"
        ? { ...base, kind: "heading", level: rendered.level }
        : { ...base, kind: "text" },
    );
  }
  return { sourceId: source.id, text: chunks.join("\n"), spans };
}
