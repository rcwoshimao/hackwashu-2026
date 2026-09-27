import { lookup } from "node:dns/promises";
import type { IncomingMessage } from "node:http";
import { request } from "node:https";
import { isIP } from "node:net";
import type { FetchResult, WebPagePort } from "@ground-control/sources";
import { safePublicUrl } from "@ground-control/sources";
import {
  maxSourceHtmlBytes,
  sourceFetchTimeoutMs,
} from "../../../config/limits.ts";

export type Address = { address: string; family: number };
export type AddressResolver = (hostname: string) => Promise<readonly Address[]>;

export function isPublicIpv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a = 0, b = 0, c = 0] = address.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && c === 0))) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

async function resolveAddress(
  host: string,
  resolver: AddressResolver,
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<readonly Address[]>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("dns_timeout")),
      sourceFetchTimeoutMs,
    );
  });
  let addresses: readonly Address[];
  try {
    addresses = await Promise.race([resolver(host), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return (
    addresses.find((item) => item.family === 4 && isPublicIpv4(item.address))
      ?.address ?? null
  );
}

export function readBody(
  response: IncomingMessage,
): Promise<FetchResult<string>> {
  return new Promise((resolve) => {
    if (response.statusCode !== 200) {
      response.destroy();
      resolve({ ok: false, error: { code: "http_error" } });
      return;
    }
    const length = Number(response.headers["content-length"] ?? 0);
    if (length > maxSourceHtmlBytes) {
      response.destroy();
      resolve({ ok: false, error: { code: "too_large" } });
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    let done = false;
    const finish = (value: FetchResult<string>) => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    response.on("data", (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > maxSourceHtmlBytes) {
        response.destroy();
        finish({ ok: false, error: { code: "too_large" } });
      } else chunks.push(chunk);
    });
    response.on("end", () =>
      finish({ ok: true, value: Buffer.concat(chunks).toString("utf8") }),
    );
    response.on("error", () =>
      finish({ ok: false, error: { code: "http_error" } }),
    );
    response.on("close", () =>
      finish({ ok: false, error: { code: "http_error" } }),
    );
  });
}

function pinnedGet(
  url: string,
  address: string,
): Promise<FetchResult<{ html: string; etag: string | null }>> {
  return new Promise((resolve) => {
    const req = request(
      url,
      {
        timeout: sourceFetchTimeoutMs,
        signal: AbortSignal.timeout(sourceFetchTimeoutMs),
        lookup: (_host, _options, callback) => callback(null, address, 4),
        headers: { "user-agent": "Ground-Control/0.1" },
      },
      (response) => {
        void readBody(response).then((body) =>
          resolve(
            body.ok
              ? {
                  ok: true,
                  value: {
                    html: body.value,
                    etag: response.headers.etag ?? null,
                  },
                }
              : body,
          ),
        );
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error) =>
      resolve({
        ok: false,
        error: {
          code:
            error.message === "timeout" ||
            error.name === "TimeoutError" ||
            error.name === "AbortError"
              ? "timeout"
              : "http_error",
        },
      }),
    );
    req.end();
  });
}

export class PinnedWebPage implements WebPagePort {
  constructor(
    private readonly resolver: AddressResolver = async (host) =>
      lookup(host, { all: true }),
  ) {}

  async readPage(
    url: string,
  ): Promise<FetchResult<{ html: string; etag: string | null }>> {
    if (url.length > 2_048 || !safePublicUrl(url))
      return { ok: false, error: { code: "unsafe_url" } };
    let address: string | null;
    try {
      address = await resolveAddress(new URL(url).hostname, this.resolver);
    } catch {
      return { ok: false, error: { code: "timeout" } };
    }
    return address === null
      ? { ok: false, error: { code: "unsafe_url" } }
      : pinnedGet(url, address);
  }
}
