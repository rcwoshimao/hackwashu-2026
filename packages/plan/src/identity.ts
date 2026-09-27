import { createHash } from "node:crypto";

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Canonical JSON requires finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value !== "object")
    throw new TypeError("Canonical JSON requires a JSON value");
  const object = value as Record<string, unknown>;
  const entries = Object.keys(object)
    .sort()
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      const item = object[key];
      return `${JSON.stringify(key)}:${canonicalJson(item)}`;
    });
  return `{${entries.join(",")}}`;
}

export function claimId(
  sourceId: string,
  quote: string,
  kind: string,
  params: unknown,
): string {
  const normalizedQuote = quote.normalize("NFC").replace(/\s+/gu, " ").trim();
  const input = `${sourceId}\n${normalizedQuote}\n${kind}\n${canonicalJson(params)}`;
  return `c_${createHash("sha256").update(input).digest("hex").slice(0, 10)}`;
}

export function factKey(kind: string, params: unknown): string {
  return `${kind}\n${canonicalJson(params)}`;
}
