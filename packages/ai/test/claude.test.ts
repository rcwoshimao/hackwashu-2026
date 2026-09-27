import { expect, test } from "bun:test";
import { ClaudeModel } from "../src/index.ts";

const input = {
  sectionText: "Run `npm run dev`.",
  candidates: [{ signal: "inline_code", quote: "npm run dev" }],
};

function answer(claims: readonly unknown[], stopReason = "end_turn"): Response {
  return new Response(
    JSON.stringify({
      stop_reason: stopReason,
      content: [{ type: "text", text: JSON.stringify({ claims }) }],
    }),
    { status: 200 },
  );
}

test("Claude adapter sends schema-bound extraction and validates checks", async () => {
  let target = "";
  let requestBody: unknown;
  let requestHeaders = new Headers();
  const transport = async (
    resource: string,
    init: RequestInit,
  ): Promise<Response> => {
    target = String(resource);
    requestBody = JSON.parse(String(init?.body));
    requestHeaders = new Headers(init?.headers);
    return answer([
      {
        kind: "script_exists",
        quote: "npm run dev",
        paramsJson: '{"script":"dev"}',
      },
      { kind: "shell_command", quote: "npm run dev", paramsJson: "{}" },
      {
        kind: "script_exists",
        quote: "npm run dev",
        paramsJson: '{"script":"dev","code":"bad"}',
      },
    ]);
  };
  const result = await new ClaudeModel(
    "fixture-key",
    "claude-sonnet-5",
    transport,
  ).extract(input);
  expect(target).toBe("https://api.anthropic.com/v1/messages");
  expect(requestHeaders?.get("anthropic-version")).toBe("2023-06-01");
  expect(requestHeaders?.has("x-api-key")).toBe(true);
  expect(requestBody).toMatchObject({
    model: "claude-sonnet-5",
    messages: [{ role: "user", content: JSON.stringify(input) }],
    output_config: { format: { type: "json_schema" } },
  });
  expect(result).toEqual({
    ok: true,
    value: [
      {
        kind: "script_exists",
        params: { script: "dev" },
        quote: "npm run dev",
      },
    ],
  });
});

test("Claude adapter rejects incomplete output and boundedly retries server failures", async () => {
  let calls = 0;
  const transport = async (): Promise<Response> => {
    calls += 1;
    return calls === 1
      ? new Response("", { status: 503 })
      : answer([], "max_tokens");
  };
  const result = await new ClaudeModel(
    "fixture-key",
    undefined,
    transport,
  ).extract(input);
  expect(calls).toBe(2);
  expect(result).toEqual({ ok: false, error: { code: "invalid_response" } });
});
