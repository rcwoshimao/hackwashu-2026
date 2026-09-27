import type {
  ConfluencePort,
  DocText,
  Source,
  WebPagePort,
} from "@ground-control/sources";
import {
  confluenceToDocText,
  docTextSchema,
  manToDocText,
  markdownToDocText,
  sourceTextHash,
  webPageToDocText,
} from "@ground-control/sources";
import type { RepositoryFilePort, Result } from "./types.ts";

export type ReaderDeps = {
  files: RepositoryFilePort;
  web: WebPagePort;
  confluence: ConfluencePort | null;
  serviceToken?: string | undefined;
};

function verified(
  doc: DocText,
  version: string | null,
): Result<{ doc: DocText; version: string | null }> {
  return doc.text.trim() && docTextSchema.safeParse(doc).success
    ? { ok: true, value: { doc, version: version ?? sourceTextHash(doc.text) } }
    : { ok: false, error: { code: "invalid_body" } };
}

function wikiDoc(
  source: Extract<Source, { kind: "wiki" }>,
  html: string,
): DocText {
  const page = webPageToDocText(
    { id: source.id, repo: source.repo, kind: "url", url: source.url },
    html,
  );
  const spans = page.spans.map((span) => ({
    ...span,
    location: {
      kind: "wiki" as const,
      sourceId: source.id,
      page: source.page,
      url: source.url,
      headingPath:
        "headingPath" in span.location ? span.location.headingPath : [],
      startOffset: span.startOffset,
      endOffset: span.endOffset,
    },
  }));
  return { sourceId: source.id, text: page.text, spans };
}

export async function fetchDocument(
  source: Source,
  privateRepo: boolean,
  userToken: string | undefined,
  deps: ReaderDeps,
): Promise<Result<{ doc: DocText; version: string | null }>> {
  if (
    source.kind === "readme" ||
    source.kind === "docs" ||
    source.kind === "man"
  ) {
    const credential = userToken || deps.serviceToken;
    if (privateRepo && !credential)
      return { ok: false, error: { code: "credential_required" } };
    const file = await deps.files.readFile(
      source.repo,
      source.path,
      credential,
    );
    if (!file.ok) return file;
    const doc =
      source.kind === "man"
        ? manToDocText(source, file.value.text)
        : markdownToDocText(source, file.value.text);
    return verified(doc, file.value.version);
  }
  if (source.kind === "confluence") {
    if (!deps.confluence) return { ok: false, error: { code: "unconfigured" } };
    const page = await deps.confluence.readPage(source.pageId);
    return page.ok
      ? verified(
          confluenceToDocText(source, page.value.storageHtml),
          String(page.value.version),
        )
      : page;
  }
  if (source.kind === "wiki" && privateRepo)
    return { ok: false, error: { code: "credential_required" } };
  const page = await deps.web.readPage(source.url);
  if (!page.ok) return page;
  return source.kind === "wiki"
    ? verified(wikiDoc(source, page.value.html), page.value.etag)
    : verified(webPageToDocText(source, page.value.html), page.value.etag);
}
