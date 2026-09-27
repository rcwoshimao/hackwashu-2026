import { Message, Space, WebhookHandler, WebhookHandler as WebhookHandler$1 } from "@spectrum-ts/core";
//#region src/index.d.ts
/**
 * The minimal structural surface of a Spectrum instance the plugin needs. Kept
 * structural (rather than importing the generic `SpectrumInstance<Providers>`)
 * so the plugin stays decoupled from provider typing; a real instance is
 * assignable via its Web `Request` webhook overload.
 */
interface WebhookReceiver {
  webhook(request: Request, handler: WebhookHandler$1): Promise<Response>;
}
export interface SpectrumPluginOptions {
  /** The Spectrum instance returned by `await Spectrum({...})`. */
  app: WebhookReceiver;
  /**
   * Invoked once per inbound message, fire-and-forget after the response — the
   * same `(space, message)` contract as `app.webhook(request, handler)`. Covers
   * both native Spectrum webhooks and fusor webhooks identically.
   */
  onMessage: WebhookHandler$1;
  /**
   * Route the webhook is mounted on.
   *
   * @default "/spectrum/webhook"
   */
  path?: string;
}
/**
 * Mount a Spectrum webhook endpoint on a Hono app.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { Spectrum } from "spectrum-ts";
 * import { spectrum } from "@spectrum-ts/hono";
 *
 * const app = await Spectrum({ ...,  webhookSecret: process.env.SPECTRUM_WEBHOOK_SECRET });
 *
 * const server = new Hono().route("/", spectrum({
 *   app,
 *   onMessage: async (space, message) => {
 *     if (message.content.type === "text") await space.send(`echo: ${message.content.text}`);
 *   },
 * }));
 * ```
 */
export declare function spectrum(options: SpectrumPluginOptions): import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
  [x: string]: {
    $post: {
      input: {};
      output: {};
      outputFormat: string;
      status: import("hono/utils/http-status").StatusCode;
    };
  };
}, "/", string>;
//#endregion
export type { Message, Space, WebhookHandler };