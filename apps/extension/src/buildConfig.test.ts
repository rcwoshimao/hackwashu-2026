import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolvePublicUrl } from "./buildConfig.ts";

test("blank PUBLIC_URL uses the configured local port without reading the next comment", () => {
  const env = "PUBLIC_URL=\n# Local port\nGROUND_CONTROL_PORT=8877\n";
  assert.equal(resolvePublicUrl(env, {}).origin, "http://localhost:8877");
});

test("explicit HTTPS PUBLIC_URL overrides local port", () => {
  const env = "PUBLIC_URL=\nGROUND_CONTROL_PORT=8877\n";
  assert.equal(
    resolvePublicUrl(env, { PUBLIC_URL: "https://ground.example" }).origin,
    "https://ground.example",
  );
});
