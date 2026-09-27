import { z } from "zod";
import { extractionInstruction, parseModelReply } from "./reply.ts";
import type { ModelInput, ModelPort, ProposedCheck, Result } from "./types.ts";

const config = { requestTimeoutMs: 20_000, retryDelayMs: 300, maxAttempts: 2 };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const responseSchema = z.object({
  stop_reason: z.string().nullable(),
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

const outputSchema = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string" },
          quote: { type: "string" },
          paramsJson: { type: "string" },
        },
        required: ["kind", "quote", "paramsJson"],
        additionalProperties: false,
      },
    },
  },
  required: ["claims"],
  additionalProperties: false,
} as const;

function messageBody(model: string, input: ModelInput): string {
  return JSON.stringify({
    model,
    max_tokens: 2048,
    system: extractionInstruction,
    messages: [{ role: "user", content: JSON.stringify(input) }],
    output_config: { format: { type: "json_schema", schema: outputSchema } },
  });
}

async function parsedMessage(
  response: Response,
): Promise<Result<readonly ProposedCheck[]>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: { code: "invalid_response" } };
  }
  const message = responseSchema.safeParse(body);
  if (!message.success || message.data.stop_reason !== "end_turn")
    return { ok: false, error: { code: "invalid_response" } };
  const text = message.data.content.find(
    (block) => block.type === "text",
  )?.text;
  return text
    ? parseModelReply(text)
    : { ok: false, error: { code: "invalid_response" } };
}

export class ClaudeModel implements ModelPort {
  readonly model: string;

  constructor(
    private readonly apiKey: string,
    model = "claude-sonnet-5",
    private readonly request: Transport = (url, init) => fetch(url, init),
  ) {
    this.model = model;
  }

  async extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>> {
    for (let attempt = 0; attempt < config.maxAttempts; attempt += 1) {
      try {
        const response = await this.request(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "anthropic-version": "2023-06-01",
              "x-api-key": this.apiKey,
            },
            body: messageBody(this.model, input),
            signal: AbortSignal.timeout(config.requestTimeoutMs),
          },
        );
        if (response.ok) return parsedMessage(response);
        if (response.status !== 429 && response.status < 500)
          return { ok: false, error: { code: "unavailable" } };
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "TimeoutError" &&
          attempt === config.maxAttempts - 1
        )
          return { ok: false, error: { code: "timeout" } };
      }
      if (attempt < config.maxAttempts - 1)
        await new Promise((resolve) =>
          setTimeout(resolve, config.retryDelayMs),
        );
    }
    return { ok: false, error: { code: "unavailable" } };
  }
}
