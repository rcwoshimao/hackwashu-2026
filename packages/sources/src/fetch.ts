import { z } from "zod";
import {
  maxSourceHtmlBytes,
  sourceFetchAttempts,
  sourceFetchTimeoutMs,
  sourceRetryBaseMs,
} from "../../../config/limits.ts";

export type FetchError = {
  code: "unsafe_url" | "timeout" | "too_large" | "http_error" | "invalid_body";
};
export type FetchResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: FetchError };
export type FetchPort = (url: string, init: RequestInit) => Promise<Response>;

const pageSchema = z.object({
  id: z.string(),
  version: z.object({ number: z.number() }),
  body: z.object({ storage: z.object({ value: z.string() }) }),
});

export function safePublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local")
    )
      return false;
    if (/^(?:127|10|0|169\.254|192\.168)\./.test(host)) return false;
    if (/^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

async function boundedText(response: Response): Promise<FetchResult<string>> {
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > maxSourceHtmlBytes)
    return { ok: false, error: { code: "too_large" } };
  const reader = response.body?.getReader();
  if (!reader) return { ok: false, error: { code: "invalid_body" } };
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > maxSourceHtmlBytes) {
      await reader.cancel();
      return { ok: false, error: { code: "too_large" } };
    }
    chunks.push(part.value);
  }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, value: new TextDecoder().decode(all) };
}

async function request(
  url: string,
  init: RequestInit,
  fetcher: FetchPort,
  attempts = sourceFetchAttempts,
): Promise<FetchResult<Response>> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetcher(url, {
        ...init,
        signal: AbortSignal.timeout(sourceFetchTimeoutMs),
        redirect: "manual",
      });
      if (response.status < 500 && response.status !== 429)
        return { ok: true, value: response };
    } catch {
      if (attempt === attempts - 1)
        return { ok: false, error: { code: "timeout" } };
    }
    if (attempt < attempts - 1)
      await new Promise((resolve) =>
        setTimeout(resolve, sourceRetryBaseMs * 2 ** attempt),
      );
  }
  return { ok: false, error: { code: "http_error" } };
}

export interface WebPagePort {
  readPage(
    url: string,
    etag?: string,
  ): Promise<FetchResult<{ html: string; etag: string | null }>>;
}

export class FetchWebPage implements WebPagePort {
  constructor(private readonly fetcher: FetchPort = fetch) {}

  async readPage(
    url: string,
    etag?: string,
  ): Promise<FetchResult<{ html: string; etag: string | null }>> {
    if (!safePublicUrl(url))
      return { ok: false, error: { code: "unsafe_url" } };
    const headers = etag ? { "if-none-match": etag } : {};
    const response = await request(url, { headers }, this.fetcher);
    if (!response.ok) return response;
    if (!response.value.ok) return { ok: false, error: { code: "http_error" } };
    const body = await boundedText(response.value);
    if (!body.ok) return body;
    return {
      ok: true,
      value: { html: body.value, etag: response.value.headers.get("etag") },
    };
  }
}

export class FixtureWebPage implements WebPagePort {
  constructor(private readonly pages: ReadonlyMap<string, string>) {}
  async readPage(
    url: string,
  ): Promise<FetchResult<{ html: string; etag: string | null }>> {
    const html = this.pages.get(url);
    return html === undefined
      ? { ok: false, error: { code: "http_error" } }
      : { ok: true, value: { html, etag: null } };
  }
}

export type ConfluencePage = {
  id: string;
  version: number;
  storageHtml: string;
};
export interface ConfluencePort {
  readPage(pageId: string): Promise<FetchResult<ConfluencePage>>;
  postFooterComment(
    pageId: string,
    storageHtml: string,
  ): Promise<FetchResult<void>>;
}

export class ConfluenceCloud implements ConfluencePort {
  constructor(
    private readonly site: string,
    private readonly email: string,
    private readonly token: string,
    private readonly fetcher: FetchPort = fetch,
  ) {}

  private endpoint(path: string): string {
    return `https://${this.site}/wiki/api/v2${path}`;
  }

  private headers(): HeadersInit {
    return {
      authorization: `Basic ${Buffer.from(`${this.email}:${this.token}`).toString("base64")}`,
      "content-type": "application/json",
    };
  }

  async readPage(pageId: string): Promise<FetchResult<ConfluencePage>> {
    if (!/^\d+$/.test(pageId))
      return { ok: false, error: { code: "unsafe_url" } };
    const response = await request(
      this.endpoint(`/pages/${pageId}?body-format=storage`),
      { headers: this.headers() },
      this.fetcher,
    );
    if (!response.ok) return response;
    if (!response.value.ok) return { ok: false, error: { code: "http_error" } };
    const body = await boundedText(response.value);
    if (!body.ok) return body;
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.value);
    } catch {
      return { ok: false, error: { code: "invalid_body" } };
    }
    const page = pageSchema.safeParse(parsed);
    return page.success
      ? {
          ok: true,
          value: {
            id: page.data.id,
            version: page.data.version.number,
            storageHtml: page.data.body.storage.value,
          },
        }
      : { ok: false, error: { code: "invalid_body" } };
  }

  async postFooterComment(
    pageId: string,
    storageHtml: string,
  ): Promise<FetchResult<void>> {
    if (!/^\d+$/.test(pageId))
      return { ok: false, error: { code: "unsafe_url" } };
    const response = await request(
      this.endpoint("/footer-comments"),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          pageId,
          body: { representation: "storage", value: storageHtml },
        }),
      },
      this.fetcher,
      1,
    );
    return response.ok && response.value.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: { code: "http_error" } };
  }
}

export class FixtureConfluence implements ConfluencePort {
  readonly comments: { pageId: string; storageHtml: string }[] = [];
  constructor(private readonly pages: ReadonlyMap<string, ConfluencePage>) {}
  async readPage(pageId: string): Promise<FetchResult<ConfluencePage>> {
    const page = this.pages.get(pageId);
    return page
      ? { ok: true, value: page }
      : { ok: false, error: { code: "http_error" } };
  }
  async postFooterComment(
    pageId: string,
    storageHtml: string,
  ): Promise<FetchResult<void>> {
    if (!this.pages.has(pageId))
      return { ok: false, error: { code: "http_error" } };
    this.comments.push({ pageId, storageHtml });
    return { ok: true, value: undefined };
  }
}
