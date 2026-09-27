import { GoogleGenAI, Type } from "@google/genai";
import { extractionInstruction, parseModelReply } from "./reply.ts";
import type { ModelInput, ModelPort, ProposedCheck, Result } from "./types.ts";

const replySchema = {
  type: Type.OBJECT,
  properties: {
    claims: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: { type: Type.STRING },
          quote: { type: Type.STRING },
          paramsJson: { type: Type.STRING },
        },
        required: ["kind", "quote", "paramsJson"],
      },
    },
  },
  required: ["claims"],
};

export class GeminiModel implements ModelPort {
  readonly model: string;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, model = "gemini-3.8-flash") {
    this.model = model;
    this.client = new GoogleGenAI({ apiKey });
  }

  async extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: JSON.stringify(input),
          config: {
            systemInstruction: extractionInstruction,
            responseMimeType: "application/json",
            responseSchema: replySchema,
            abortSignal: AbortSignal.timeout(20_000),
          },
        });
        return response.text
          ? parseModelReply(response.text)
          : { ok: false, error: { code: "invalid_response" } };
      } catch {
        if (attempt === 0)
          await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    return { ok: false, error: { code: "unavailable" } };
  }
}

export class FixtureModel implements ModelPort {
  readonly model = "fixture";
  constructor(
    private readonly answers: ReadonlyMap<string, readonly ProposedCheck[]>,
  ) {}
  async extract(input: ModelInput): Promise<Result<readonly ProposedCheck[]>> {
    return { ok: true, value: this.answers.get(input.sectionText) ?? [] };
  }
}
