import { describe, expect, test } from "bun:test";
import {
  confluenceToDocText,
  discoverRepoSources,
  FixtureConfluence,
  FixtureWebPage,
  manToDocText,
  markdownToDocText,
  mentionedDocUrls,
  parseGroundControlConfig,
  quoteInLocation,
  safePublicUrl,
  sourceTextHash,
  splitSections,
  webPageToDocText,
} from "../src/index.ts";

const repo = "example/orbit";

describe("source conversion", () => {
  test("Markdown keeps exact file lines and section hashes", () => {
    const source = {
      id: "readme",
      repo,
      kind: "readme" as const,
      path: "README.md",
    };
    const doc = markdownToDocText(
      source,
      "# Orbit\n\nRun `npm test` on port 3000.\n",
    );
    expect(doc.spans.map((span) => span.kind)).toEqual(["heading", "text"]);
    const paragraph = doc.spans[1];
    expect(paragraph?.location.kind).toBe("file");
    expect(
      paragraph?.location.kind === "file" && paragraph.location.lineStart,
    ).toBe(3);
    expect(
      paragraph && quoteInLocation(doc, paragraph.location, "port 3000"),
    ).toBe(true);
    expect(splitSections(doc)).toHaveLength(1);
    expect(sourceTextHash(doc.text)).toHaveLength(64);
  });

  test("wiki headings map to the page", () => {
    const source = {
      id: "wiki",
      repo,
      kind: "wiki" as const,
      page: "Home",
      url: "https://github.com/example/orbit/wiki",
    };
    const doc = markdownToDocText(
      source,
      "# Start\n\n## Install\n\nRun npm install.\n",
    );
    const location = doc.spans.at(-1)?.location;
    expect(location?.kind).toBe("wiki");
    expect(location?.kind === "wiki" && location.headingPath).toEqual([
      "Start",
      "Install",
    ]);
  });

  test("man page maps rendered words to original roff lines", () => {
    const source = {
      id: "man",
      repo,
      kind: "man" as const,
      path: "man/orbit.1",
    };
    const doc = manToDocText(
      source,
      ".TH ORBIT 1\n.SH NAME\nOrbit CLI\n.PP\n.B --port\nDefaults to 3000.\n",
    );
    expect(doc.text).toContain("Defaults to 3000.");
    const last = doc.spans.at(-1);
    expect(last?.location.kind === "file" && last.location.lineStart).toBe(6);
    expect(last && quoteInLocation(doc, last.location, "3000")).toBe(true);
  });

  test("Confluence code macro is a code span with heading path", () => {
    const source = {
      id: "conf",
      repo,
      kind: "confluence" as const,
      site: "team.atlassian.net",
      pageId: "123",
      url: "https://team.atlassian.net/wiki/spaces/X/pages/123",
    };
    const doc = confluenceToDocText(
      source,
      '<h2>Install</h2><p>Set PORT=3000.</p><ac:structured-macro ac:name="code"><ac:plain-text-body>npm install</ac:plain-text-body></ac:structured-macro>',
    );
    expect(doc.spans.map((span) => span.kind)).toEqual([
      "heading",
      "text",
      "code",
    ]);
    expect(
      doc.spans[2]?.location.kind === "confluence" &&
        doc.spans[2].location.headingPath,
    ).toEqual(["Install"]);
    expect(doc.text).toContain("npm install");
  });

  test("web page reader removes navigation and keeps article headings", () => {
    const source = {
      id: "web",
      repo,
      kind: "url" as const,
      url: "https://docs.example.com/start",
    };
    const doc = webPageToDocText(
      source,
      "<html><body><nav>Buy now</nav><article><h1>Start</h1><p>Run npm test on port 3000.</p><pre>npm test</pre></article></body></html>",
    );
    expect(doc.text).toContain("Run npm test");
    expect(doc.text).not.toContain("Buy now");
    expect(doc.spans.some((span) => span.kind === "code")).toBe(true);
  });
});

describe("source discovery and adapters", () => {
  test("config and automatic links give validated sources", () => {
    const config = parseGroundControlConfig(
      "sources:\n  - man: man/orbit.1\n  - wiki: true\n",
    );
    expect(config.ok).toBe(true);
    if (!config.ok) return;
    const sources = discoverRepoSources(
      repo,
      ["README.md", "docs/start.md", "man/orbit.1"],
      "Read the [guide](https://docs.example.com/guide).",
      config.value,
    );
    expect(sources.map((source) => source.kind).sort()).toEqual([
      "docs",
      "man",
      "readme",
      "url",
      "wiki",
    ]);
    expect(
      mentionedDocUrls("[site](https://docs.example.com/guide)"),
    ).toHaveLength(1);
    expect(parseGroundControlConfig("sources: [unknown]").ok).toBe(false);
  });

  test("README references classify wiki and Confluence pages", () => {
    const sources = discoverRepoSources(
      repo,
      ["README.md"],
      "[wiki](https://github.com/example/orbit/wiki/Getting-Started) and [guide](https://team.atlassian.net/wiki/spaces/ENG/pages/123/Guide)",
    );
    expect(sources.find((item) => item.kind === "wiki")?.kind).toBe("wiki");
    expect(sources.find((item) => item.kind === "confluence")?.kind).toBe(
      "confluence",
    );
  });

  test("web URL guard and fake adapters", async () => {
    expect(safePublicUrl("https://localhost/docs")).toBe(false);
    expect(safePublicUrl("https://docs.example.com/start")).toBe(true);
    const page = new FixtureWebPage(
      new Map([["https://docs.example.com/start", "<p>Hi</p>"]]),
    );
    expect((await page.readPage("https://docs.example.com/start")).ok).toBe(
      true,
    );
    const confluence = new FixtureConfluence(
      new Map([["123", { id: "123", version: 1, storageHtml: "<p>Hi</p>" }]]),
    );
    expect((await confluence.readPage("123")).ok).toBe(true);
    expect((await confluence.postFooterComment("123", "<p>Fix</p>")).ok).toBe(
      true,
    );
    expect(confluence.comments).toHaveLength(1);
  });
});
