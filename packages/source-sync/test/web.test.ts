import { expect, test } from "bun:test";
import type { IncomingMessage } from "node:http";
import { PassThrough } from "node:stream";
import { maxSourceHtmlBytes } from "../../../config/limits.ts";
import { readBody } from "../src/web.ts";

function fakeResponse(
  statusCode: number,
  headers: Record<string, string> = {},
): IncomingMessage {
  return Object.assign(new PassThrough(), {
    statusCode,
    headers,
  }) as unknown as IncomingMessage;
}

test("web source refuses redirects before reading their body", async () => {
  const response = fakeResponse(302, { location: "https://127.0.0.1/private" });
  expect(await readBody(response)).toMatchObject({
    ok: false,
    error: { code: "http_error" },
  });
});

test("web source bounds advertised and streaming response size", async () => {
  const advertised = fakeResponse(200, {
    "content-length": String(maxSourceHtmlBytes + 1),
  });
  expect(await readBody(advertised)).toMatchObject({
    ok: false,
    error: { code: "too_large" },
  });
  const streamed = fakeResponse(200);
  const pending = readBody(streamed);
  streamed.push(Buffer.alloc(maxSourceHtmlBytes + 1));
  expect(await pending).toMatchObject({
    ok: false,
    error: { code: "too_large" },
  });
});
