import { expect, test } from "bun:test";
import { keepStream } from "../src/stream.ts";

test("an ended inbound stream reconnects and reads the next session", async () => {
  const events: string[] = [];
  let stopped = false;
  const first = {
    async read() {
      events.push("read-first");
      throw new Error("stream-ended");
    },
    async close() {
      events.push("close-first");
    },
  };
  const second = {
    async read() {
      events.push("read-second");
      stopped = true;
    },
    async close() {
      events.push("close-second");
    },
  };
  let attempts = 0;
  const waits: number[] = [];
  await keepStream(
    first,
    async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporarily unavailable");
      events.push("connect-second");
      return second;
    },
    async (attempt) => {
      waits.push(attempt);
      events.push("wait");
    },
    () => stopped,
    () => {
      events.push("disconnected");
    },
  );
  expect(events).toEqual([
    "read-first",
    "disconnected",
    "close-first",
    "wait",
    "disconnected",
    "wait",
    "connect-second",
    "read-second",
  ]);
  expect(waits).toEqual([0, 1]);
});
