import type { Claim } from "./protocol.ts";

type Position = { node: Text; start: number; end: number };
export type TextIndex = { text: string; positions: Position[] };
export type ClaimMatch = { claim: Claim; start: number; end: number };

const skipped =
  "script, style, textarea, input, button, nav, header, footer, aside, [data-gc-claim]";

export function normalizeWhite(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function eligible(node: Text): boolean {
  const parent = node.parentElement;
  return !!parent && !parent.closest(skipped) && !!node.textContent?.trim();
}

function appendText(chars: string[], positions: Position[], node: Text): void {
  const value = node.textContent ?? "";
  for (let offset = 0; offset < value.length; offset += 1) {
    const white = /\s/.test(value[offset] ?? "");
    const previous = positions.at(-1);
    if (white && (chars.length === 0 || chars.at(-1) === " ")) {
      if (previous?.node === node) previous.end = offset + 1;
      continue;
    }
    chars.push(white ? " " : (value[offset] ?? ""));
    positions.push({ node, start: offset, end: offset + 1 });
  }
}

export function indexText(root: Element): TextIndex {
  const chars: string[] = [];
  const positions: Position[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    if (eligible(node)) appendText(chars, positions, node);
    current = walker.nextNode();
  }
  if (chars.at(-1) === " ") {
    chars.pop();
    positions.pop();
  }
  return { text: chars.join(""), positions };
}

export function findClaimMatches(
  index: TextIndex,
  claims: readonly Claim[],
): ClaimMatch[] {
  const matches: ClaimMatch[] = [];
  const occupied = new Uint8Array(index.text.length);
  for (const claim of claims) {
    const query = normalizeWhite(claim.quote);
    if (!query) continue;
    let from = 0;
    while (from < index.text.length) {
      const start = index.text.indexOf(query, from);
      if (start < 0) break;
      const end = start + query.length;
      let overlaps = false;
      for (let offset = start; offset < end; offset += 1) {
        if (occupied[offset]) overlaps = true;
      }
      if (!overlaps) {
        matches.push({ claim, start, end });
        for (let offset = start; offset < end; offset += 1)
          occupied[offset] = 1;
      }
      from = end;
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function segments(index: TextIndex, start: number, end: number): Position[] {
  const parts: Position[] = [];
  for (let offset = start; offset < end; offset += 1) {
    const position = index.positions[offset];
    if (!position) continue;
    const last = parts.at(-1);
    if (last?.node === position.node && last.end <= position.start) {
      last.end = position.end;
    } else parts.push({ ...position });
  }
  return parts;
}

export function wrapClaimMatches(
  root: Element,
  index: TextIndex,
  matches: readonly ClaimMatch[],
  onMark: (mark: HTMLElement, claim: Claim) => void,
): void {
  for (const match of matches) {
    for (const part of segments(index, match.start, match.end).reverse()) {
      const mark = root.ownerDocument.createElement("mark");
      mark.dataset.gcClaim = match.claim.id;
      mark.dataset.state = match.claim.state;
      mark.tabIndex = 0;
      onMark(mark, match.claim);
      const value = part.node.data;
      const middle = root.ownerDocument.createTextNode(
        value.slice(part.start, part.end),
      );
      const tail = root.ownerDocument.createTextNode(value.slice(part.end));
      part.node.data = value.slice(0, part.start);
      part.node.after(mark, tail);
      mark.append(middle);
    }
  }
}

export function clearClaimMarks(root: Element): void {
  for (const mark of Array.from(root.querySelectorAll("mark[data-gc-claim]"))) {
    mark.replaceWith(root.ownerDocument.createTextNode(mark.textContent ?? ""));
  }
}
