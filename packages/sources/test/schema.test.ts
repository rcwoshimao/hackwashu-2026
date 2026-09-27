import { expect, test } from "bun:test";
import fc from "fast-check";
import {
  docSpanSchema,
  docTextSchema,
  locationSchema,
  quoteInLocation,
  relativePathSchema,
  sourceKindSchema,
  sourceSchema,
} from "../src/index";

const fileLocation = {
  kind: "file" as const,
  sourceId: "readme",
  path: "README.md",
  lineStart: 1,
  lineEnd: 1,
  startOffset: 0,
  endOffset: 5,
};

test("all six source kinds parse", () => {
  const base = { id: "source-1", repo: "team/repo" };
  const sources = [
    { ...base, kind: "readme", path: "README.md" },
    { ...base, kind: "docs", path: "docs/setup.md" },
    { ...base, kind: "man", path: "man/orbit.1" },
    {
      ...base,
      kind: "wiki",
      page: "Getting Started",
      url: "https://github.com/team/repo/wiki/Getting-Started",
    },
    {
      ...base,
      kind: "confluence",
      site: "team.atlassian.net",
      pageId: "123",
      url: "https://team.atlassian.net/wiki/pages/123",
    },
    {
      ...base,
      kind: "url",
      url: "https://docs.example.com/setup",
      owner: "maintainer",
    },
  ];
  for (const source of sources)
    expect(sourceSchema.safeParse(source).success).toBe(true);
  expect(sourceSchema.safeParse({ ...base, kind: "unknown" }).success).toBe(
    false,
  );
});

test("source kind and repo paths reject unsupported values", () => {
  expect(sourceKindSchema.safeParse("confluence").success).toBe(true);
  expect(sourceKindSchema.safeParse("local").success).toBe(false);
  for (const path of [
    "/etc/passwd",
    "../outside",
    "docs/../outside",
    "C:/tmp/file",
    "docs\\setup.md",
    "docs//setup.md",
    ".",
  ]) {
    expect(relativePathSchema.safeParse(path).success).toBe(false);
  }
  expect(relativePathSchema.safeParse("docs/setup.md").success).toBe(true);
  expect(
    sourceSchema.safeParse({
      id: "x",
      repo: "bad",
      kind: "readme",
      path: "README.md",
    }).success,
  ).toBe(false);
});

test("generalized locations validate ranges", () => {
  const common = { sourceId: "s", startOffset: 0, endOffset: 5 };
  const locations = [
    { ...common, kind: "file", path: "README.md", lineStart: 1, lineEnd: 2 },
    {
      ...common,
      kind: "wiki",
      page: "Start",
      headingPath: ["Install"],
      url: "https://github.com/a/b/wiki/Start",
    },
    {
      ...common,
      kind: "confluence",
      pageId: "123",
      headingPath: ["Install"],
      url: "https://team.atlassian.net/wiki/pages/123",
    },
    {
      ...common,
      kind: "url",
      headingPath: ["Install"],
      url: "https://docs.example.com/start",
    },
  ];
  for (const location of locations)
    expect(locationSchema.safeParse(location).success).toBe(true);
  expect(
    locationSchema.safeParse({ ...locations[0], lineStart: 3, lineEnd: 2 })
      .success,
  ).toBe(false);
  expect(
    locationSchema.safeParse({ ...locations[1], endOffset: 0 }).success,
  ).toBe(false);
});

test("DocText spans map normalized offsets back to locations", () => {
  const heading = {
    kind: "heading",
    startOffset: 0,
    endOffset: 5,
    level: 2,
    location: fileLocation,
  };
  const doc = { sourceId: "readme", text: "Start", spans: [heading] };
  expect(docSpanSchema.safeParse(heading).success).toBe(true);
  expect(docTextSchema.safeParse(doc).success).toBe(true);
  expect(docTextSchema.safeParse({ ...doc, sourceId: "other" }).success).toBe(
    false,
  );
  expect(
    docTextSchema.safeParse({ ...doc, spans: [{ ...heading, endOffset: 6 }] })
      .success,
  ).toBe(false);
  expect(
    docTextSchema.safeParse({ ...doc, spans: [heading, heading] }).success,
  ).toBe(false);
});

test("every stored quote is an exact substring of its mapped location", () => {
  fc.assert(
    fc.property(
      fc.string({ maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 40 }),
      fc.string({ maxLength: 20 }),
      (prefix, quote, suffix) => {
        const text = `${prefix}${quote}${suffix}`;
        const spanLocation = locationSchema.parse({
          ...fileLocation,
          endOffset: text.length,
        });
        const location = locationSchema.parse({
          ...fileLocation,
          startOffset: prefix.length,
          endOffset: prefix.length + quote.length,
        });
        const doc = docTextSchema.parse({
          sourceId: "readme",
          text,
          spans: [
            {
              kind: "text",
              startOffset: 0,
              endOffset: text.length,
              location: spanLocation,
            },
          ],
        });
        return quoteInLocation(doc, location, quote);
      },
    ),
    { numRuns: 1000 },
  );
});

test("quote grounding rejects wrong text, unmapped ranges, and wrong origins", () => {
  const doc = docTextSchema.parse({
    sourceId: "readme",
    text: "Start",
    spans: [
      { kind: "text", startOffset: 0, endOffset: 5, location: fileLocation },
    ],
  });
  expect(
    quoteInLocation(doc, locationSchema.parse(fileLocation), "start"),
  ).toBe(false);
  expect(quoteInLocation(doc, locationSchema.parse(fileLocation), "")).toBe(
    false,
  );
  expect(
    quoteInLocation(
      { ...doc, spans: [] },
      locationSchema.parse(fileLocation),
      "Start",
    ),
  ).toBe(false);
  expect(
    quoteInLocation(
      doc,
      locationSchema.parse({ ...fileLocation, path: "docs/other.md" }),
      "Start",
    ),
  ).toBe(false);
});

test("quote elsewhere in DocText does not ground the cited location", () => {
  const distant = docTextSchema.parse({
    sourceId: "readme",
    text: "port 3000 port 8080",
    spans: [
      {
        kind: "text",
        startOffset: 0,
        endOffset: 19,
        location: { ...fileLocation, endOffset: 19 },
      },
    ],
  });
  expect(
    quoteInLocation(
      distant,
      locationSchema.parse({ ...fileLocation, startOffset: 0, endOffset: 9 }),
      "port 8080",
    ),
  ).toBe(false);
});
