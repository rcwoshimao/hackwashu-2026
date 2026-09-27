import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/server.js";

test("health and planets routes return stable response shapes", async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok", version: "1.0.0" });
    const planets = await fetch(`${base}/api/planets`);
    assert.deepEqual(await planets.json(), {
      planets: ["Mercury", "Venus", "Earth", "Mars"],
    });
  } finally {
    server.close();
  }
});
