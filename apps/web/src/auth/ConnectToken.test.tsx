import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectToken } from "./ConnectToken.tsx";

test("connect setup presents the returned token and exact Actions settings", () => {
  const markup = renderToStaticMarkup(
    <ConnectToken
      token="one-time-telemetry-token"
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /type="password"/);
  assert.match(markup, /value="one-time-telemetry-token"/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /GROUND_CONTROL_URL/);
  assert.match(markup, /https:\/\/demo\.example/);
});
