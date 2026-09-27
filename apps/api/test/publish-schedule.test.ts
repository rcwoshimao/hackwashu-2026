import { expect, test } from "bun:test";
import { planPublishDebounceMs } from "../../../config/limits.ts";
import { FlightPlanPublishQueue } from "../src/publish-schedule.ts";

test("rapid source plans publish once per repo after the debounce", () => {
  const pending = new Map<number, () => void>();
  const delays: number[] = [];
  let next = 0;
  const clock = {
    set(callback: () => void, delayMs: number): number {
      next += 1;
      pending.set(next, callback);
      delays.push(delayMs);
      return next;
    },
    clear(timer: unknown): void {
      pending.delete(timer as number);
    },
  };
  const published: string[] = [];
  const queue = new FlightPlanPublishQueue(
    async (repo) => {
      published.push(repo);
    },
    () => {
      throw new Error("unexpected publish error");
    },
    planPublishDebounceMs,
    clock,
  );
  queue.schedule("owner/project");
  queue.schedule("owner/project");
  queue.schedule("owner/other");
  expect(pending.size).toBe(2);
  expect(delays).toEqual([
    planPublishDebounceMs,
    planPublishDebounceMs,
    planPublishDebounceMs,
  ]);
  for (const fire of pending.values()) fire();
  expect(published).toEqual(["owner/project", "owner/other"]);
});

test("a rejected publication reports the affected repository", async () => {
  let fire: (() => void) | undefined;
  const failed: string[] = [];
  const queue = new FlightPlanPublishQueue(
    async () => {
      throw new Error("GitHub unavailable");
    },
    (repo) => {
      failed.push(repo);
    },
    0,
    {
      set(callback) {
        fire = callback;
        return 1;
      },
      clear() {},
    },
  );
  queue.schedule("owner/project");
  fire?.();
  await Bun.sleep(0);
  expect(failed).toEqual(["owner/project"]);
});
