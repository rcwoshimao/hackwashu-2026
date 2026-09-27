import { z } from "zod";

const identifierSchema = z.string().min(1);
const repoSchema = z.string().regex(/^[^/\s]+\/[^/\s]+$/);
export const relativePathSchema = z
  .string()
  .min(1)
  .refine((path) => {
    if (path.startsWith("/") || path.includes("\\") || path.includes(":"))
      return false;
    return path
      .split("/")
      .every((part) => part !== "" && part !== "." && part !== "..");
  });
const pageUrlSchema = z.url().refine((url) => /^https?:\/\//i.test(url));

export const sourceKindSchema = z.enum([
  "readme",
  "docs",
  "wiki",
  "man",
  "confluence",
  "url",
]);

export const sourceSchema = z.discriminatedUnion("kind", [
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("readme"),
    path: relativePathSchema,
  }),
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("docs"),
    path: relativePathSchema,
  }),
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("man"),
    path: relativePathSchema,
  }),
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("wiki"),
    page: identifierSchema,
    url: pageUrlSchema,
  }),
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("confluence"),
    site: identifierSchema,
    pageId: identifierSchema,
    url: pageUrlSchema,
  }),
  z.object({
    id: identifierSchema,
    repo: repoSchema,
    kind: z.literal("url"),
    url: pageUrlSchema,
    owner: identifierSchema.optional(),
  }),
]);

const offsetsSchema = z.object({
  sourceId: identifierSchema,
  startOffset: z.int().nonnegative(),
  endOffset: z.int().positive(),
});

export const locationSchema = z
  .discriminatedUnion("kind", [
    offsetsSchema.extend({
      kind: z.literal("file"),
      path: relativePathSchema,
      lineStart: z.int().positive(),
      lineEnd: z.int().positive(),
    }),
    offsetsSchema.extend({
      kind: z.literal("wiki"),
      page: identifierSchema,
      headingPath: z.array(identifierSchema),
      url: pageUrlSchema,
    }),
    offsetsSchema.extend({
      kind: z.literal("confluence"),
      pageId: identifierSchema,
      headingPath: z.array(identifierSchema),
      url: pageUrlSchema,
    }),
    offsetsSchema.extend({
      kind: z.literal("url"),
      url: pageUrlSchema,
      headingPath: z.array(identifierSchema),
    }),
  ])
  .superRefine((location, context) => {
    if (location.startOffset >= location.endOffset) {
      context.addIssue({
        code: "custom",
        path: ["endOffset"],
        message: "Location must cover text",
      });
    }
    if (location.kind === "file" && location.lineStart > location.lineEnd) {
      context.addIssue({
        code: "custom",
        path: ["lineEnd"],
        message: "Line range is reversed",
      });
    }
  });

const spanBaseSchema = z.object({
  startOffset: z.int().nonnegative(),
  endOffset: z.int().positive(),
  location: locationSchema,
});

export const docSpanSchema = z.discriminatedUnion("kind", [
  spanBaseSchema.extend({
    kind: z.literal("heading"),
    level: z.int().min(1).max(6),
  }),
  spanBaseSchema.extend({ kind: z.literal("text") }),
  spanBaseSchema.extend({
    kind: z.literal("code"),
    language: z.string().nullable(),
  }),
]);

export const docTextSchema = z
  .object({
    sourceId: identifierSchema,
    text: z.string(),
    spans: z.array(docSpanSchema),
  })
  .superRefine((doc, context) => {
    let previousEnd = 0;
    for (const [index, span] of doc.spans.entries()) {
      const valid =
        span.startOffset >= previousEnd &&
        span.startOffset < span.endOffset &&
        span.endOffset <= doc.text.length &&
        span.location.sourceId === doc.sourceId &&
        span.location.startOffset === span.startOffset &&
        span.location.endOffset === span.endOffset;
      if (!valid)
        context.addIssue({
          code: "custom",
          path: ["spans", index],
          message: "Span must map to an ordered range of this document",
        });
      previousEnd = span.endOffset;
    }
  });

export type Source = z.infer<typeof sourceSchema>;
export type SourceKind = z.infer<typeof sourceKindSchema>;
export type Location = z.infer<typeof locationSchema>;
export type DocSpan = z.infer<typeof docSpanSchema>;
export type DocText = z.infer<typeof docTextSchema>;

function originKey(location: Location): string {
  switch (location.kind) {
    case "file":
      return `file:${location.path}`;
    case "wiki":
      return `wiki:${location.page}:${location.url}`;
    case "confluence":
      return `confluence:${location.pageId}:${location.url}`;
    case "url":
      return `url:${location.url}`;
  }
}

export function quoteInLocation(
  doc: DocText,
  location: Location,
  quote: string,
): boolean {
  if (quote.length === 0 || location.sourceId !== doc.sourceId) return false;
  if (location.startOffset < 0 || location.endOffset > doc.text.length)
    return false;
  const mapped = doc.spans.some(
    (span) =>
      span.startOffset <= location.startOffset &&
      span.endOffset >= location.endOffset &&
      originKey(span.location) === originKey(location),
  );
  if (!mapped) return false;
  return doc.text
    .slice(location.startOffset, location.endOffset)
    .includes(quote);
}

export type { GroundControlConfig, SourceDiscoveryError } from "./discovery.ts";
export {
  discoverRepoSources,
  mentionedDocUrls,
  parseGroundControlConfig,
} from "./discovery.ts";
export type {
  ConfluencePage,
  ConfluencePort,
  FetchError,
  FetchResult,
  WebPagePort,
} from "./fetch.ts";
export {
  ConfluenceCloud,
  FetchWebPage,
  FixtureConfluence,
  FixtureWebPage,
  safePublicUrl,
} from "./fetch.ts";
export { confluenceToDocText, webPageToDocText } from "./html.ts";
export { manToDocText } from "./man.ts";
export { markdownToDocText } from "./markdown.ts";
export type { DocSection } from "./sections.ts";
export { sourceTextHash, splitSections } from "./sections.ts";
