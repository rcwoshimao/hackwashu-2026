import type { EventRecord } from "@ground-control/store";
import { sessionToken } from "./access.ts";
import type { ApiDeps } from "./types.ts";

const keepAliveMs = 15_000;

function frame(event: EventRecord): string {
  return `id: ${event.sequence}\nevent: ${event.kind}\ndata: ${JSON.stringify(event.payload)}\n\n`;
}

export function eventStream(deps: ApiDeps, request: Request): Response {
  const encoder = new TextEncoder();
  const session = deps.auth.session(sessionToken(request));
  const cursor = Number(request.headers.get("last-event-id") ?? "0") || 0;
  let unsubscribe = () => {};
  let timer: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      const send = async (event: EventRecord): Promise<void> => {
        const payload = event.payload;
        const repoName =
          typeof payload === "object" && payload !== null && "repo" in payload
            ? payload.repo
            : null;
        if (typeof repoName === "string") {
          const repo = deps.store.getRepo(repoName);
          if (repo?.visibility === "private") {
            if (session === null) return;
            const permission = await deps.auth.access(session, repoName);
            if (!permission.ok || !permission.value.canRead) return;
          }
        }
        if (!closed) controller.enqueue(encoder.encode(frame(event)));
      };
      for (const event of deps.store.eventsAfter(cursor)) void send(event);
      unsubscribe = deps.events.subscribe((event) => {
        void send(event);
      });
      timer = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, keepAliveMs);
    },
    cancel() {
      closed = true;
      unsubscribe();
      if (timer !== null) clearInterval(timer);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
