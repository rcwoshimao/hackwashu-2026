import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { createApi } from "../src/index.ts";
import { setup } from "./fixture.ts";

test("API serves built web assets and SPA routes without swallowing API", async () => {
  const { store, auth, events } = setup();
  const webDist = fileURLToPath(new URL("./fixtures/web", import.meta.url));
  const app = createApi({
    store,
    auth,
    events,
    now: () => new Date(),
    publicUrl: "http://localhost:8787",
    webDist,
  });
  const page = await app.request("/runs/run_123");
  expect(page.status).toBe(200);
  expect(await page.text()).toContain("Ground Control fixture");
  const reports = await app.request("/reports");
  expect(reports.status).toBe(200);
  expect(await reports.text()).toContain("Ground Control fixture");
  const asset = await app.request("/assets/app.js");
  expect(asset.status).toBe(200);
  expect(asset.headers.get("cache-control")).toContain("immutable");
  expect((await app.request("/api/sky")).headers.get("content-type")).toContain(
    "application/json",
  );
  expect((await app.request("/not-a-route")).status).toBe(404);
});
