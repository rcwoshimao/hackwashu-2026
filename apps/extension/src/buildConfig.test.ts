import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolvePublicUrl } from "./buildConfig.ts";

test("blank PUBLIC_URL uses the hosted server without reading the next comment", () => {
  const env = "PUBLIC_URL=\n# Local port\nGROUND_CONTROL_PORT=8877\n";
  assert.equal(
    resolvePublicUrl(env, {}).origin,
    "https://ground-control-washu26.azurewebsites.net",
  );
});

test("explicit HTTPS PUBLIC_URL overrides local port", () => {
  const env = "PUBLIC_URL=\nGROUND_CONTROL_PORT=8877\n";
  assert.equal(
    resolvePublicUrl(env, { PUBLIC_URL: "https://ground.example" }).origin,
    "https://ground.example",
  );
});

test("explicit local PUBLIC_URL remains available for self-hosted development", () => {
  assert.equal(
    resolvePublicUrl("PUBLIC_URL=http://localhost:8877\n", {}).origin,
    "http://localhost:8877",
  );
});
