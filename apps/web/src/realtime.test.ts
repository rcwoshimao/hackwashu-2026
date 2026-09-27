import { strict as assert } from "node:assert";
import { test } from "node:test";
import { watchEvents } from "./realtime.ts";

test("named server events refresh views and cleanup stops delivery", () => {
  const source = new EventTarget();
  let calls = 0;
  const stop = watchEvents(source, ["scan_complete", "run"], () => {
    calls += 1;
  });
  source.dispatchEvent(new Event("scan_complete"));
  source.dispatchEvent(new Event("run"));
  source.dispatchEvent(new Event("message"));
  assert.equal(calls, 2);
  stop();
  source.dispatchEvent(new Event("scan_complete"));
  assert.equal(calls, 2);
});
