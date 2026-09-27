import {
  type PlatformProviderConfig,
  Spectrum,
  type SpectrumInstance,
} from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import type {
  IMessagePort,
  InboundMessage,
  OutboundRoute,
  Result,
} from "./types.ts";

export type SpectrumIMessage = IMessagePort & {
  run(onMessage: (message: InboundMessage) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
};

type CloudUser = { id: string };
type CloudSpace = {
  id: string;
  type: "dm" | "group";
  phone: string;
  send(text: string): Promise<unknown>;
};
type CloudInstance = {
  user(address: string): Promise<CloudUser>;
  space: {
    create(user: CloudUser, params?: { phone: string }): Promise<CloudSpace>;
    get(chatId: string, params?: { phone: string }): Promise<CloudSpace>;
  };
};

async function sendTo(
  im: CloudInstance,
  recipientAddress: string,
  text: string,
  linePhone?: string,
): Promise<Result<OutboundRoute>> {
  try {
    const user = await im.user(recipientAddress);
    const space = linePhone
      ? await im.space.create(user, { phone: linePhone })
      : await im.space.create(user);
    await space.send(text);
    return {
      ok: true,
      value: { chatId: space.id, recipientId: user.id, linePhone: space.phone },
    };
  } catch {
    return { ok: false, error: { code: "send_failed" } };
  }
}

async function replyOn(
  im: CloudInstance,
  chatId: string,
  text: string,
  linePhone?: string,
): Promise<Result<void>> {
  try {
    const space = linePhone
      ? await im.space.get(chatId, { phone: linePhone })
      : await im.space.get(chatId);
    await space.send(text);
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: { code: "send_failed" } };
  }
}

async function receiveFrom(
  app: SpectrumInstance,
  onMessage: (message: InboundMessage) => Promise<void>,
): Promise<void> {
  for await (const [space, message] of app.messages) {
    if (
      message.platform !== "imessage" ||
      message.content.type !== "text" ||
      !message.sender
    )
      continue;
    const received = imessage(message);
    const chat = imessage(space) as unknown as CloudSpace;
    if (received.direction !== "inbound" || chat.type !== "dm") continue;
    await onMessage({
      id: message.id,
      senderId: message.sender.id,
      ...(received.sender?.address
        ? { senderAddress: received.sender.address }
        : {}),
      chatId: space.id,
      linePhone: chat.phone,
      text: message.content.text,
    });
  }
}

export async function createSpectrumIMessage(config: {
  projectId: string;
  projectSecret: string;
}): Promise<Result<SpectrumIMessage>> {
  if (!config.projectId || !config.projectSecret) {
    return { ok: false, error: { code: "unconfigured" } };
  }
  try {
    // The published Spectrum overloads erase optional cloud space params.
    const configure = imessage.config as unknown as (
      input: Record<string, never>,
    ) => PlatformProviderConfig;
    const provider = configure({});
    const app = await Spectrum({
      projectId: config.projectId,
      projectSecret: config.projectSecret,
      providers: [provider],
    });
    const im = imessage(app) as unknown as CloudInstance;
    return {
      ok: true,
      value: {
        send: (address, text, line) => sendTo(im, address, text, line),
        reply: (chatId, text, line) => replyOn(im, chatId, text, line),
        run: (onMessage) => receiveFrom(app, onMessage),
        stop: () => app.stop(),
      },
    };
  } catch {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export class RecordingIMessage implements IMessagePort {
  readonly sent: {
    recipientAddress: string;
    text: string;
    linePhone?: string;
  }[] = [];
  readonly replies: { chatId: string; text: string; linePhone?: string }[] = [];

  constructor(
    private readonly outboundRoute: OutboundRoute = {
      chatId: "chat",
      linePhone: "+15550000000",
    },
  ) {}

  async send(
    recipientAddress: string,
    text: string,
    linePhone?: string,
  ): Promise<Result<OutboundRoute>> {
    this.sent.push({
      recipientAddress,
      text,
      ...(linePhone ? { linePhone } : {}),
    });
    return {
      ok: true,
      value: {
        ...this.outboundRoute,
        recipientId: this.outboundRoute.recipientId ?? recipientAddress,
      },
    };
  }

  async reply(
    chatId: string,
    text: string,
    linePhone?: string,
  ): Promise<Result<void>> {
    this.replies.push({ chatId, text, ...(linePhone ? { linePhone } : {}) });
    return { ok: true, value: undefined };
  }
}
