import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectToken } from "./ConnectToken.tsx";

test("connect setup presents the returned token and exact Actions settings", () => {
  const markup = renderToStaticMarkup(
    <ConnectToken
      token="one-time-telemetry-token"
      serverUrl="https://demo.example"
      repo="owner/repo"
    />,
  );
  assert.match(markup, /type="password"/);
  assert.match(markup, /value="one-time-telemetry-token"/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /GROUND_CONTROL_URL/);
  assert.match(markup, /https:\/\/demo\.example/);
  assert.match(markup, /gh secret set GROUND_CONTROL_TOKEN -R owner\/repo/);
  assert.match(markup, /gh variable set GROUND_CONTROL_URL -R owner\/repo/);
  assert.doesNotMatch(markup, /--body.*one-time-telemetry-token/);
});

test("localhost is not presented as an Actions server URL", () => {
  const markup = renderToStaticMarkup(
    <ConnectToken
      token="one-time-telemetry-token"
      serverUrl="http://localhost:8877"
      repo="owner/repo"
    />,
  );
  assert.match(markup, /GROUND_CONTROL_URL/);
  assert.match(markup, /Public HTTPS URL/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_URL.*localhost/);
  assert.doesNotMatch(markup, /gh variable set/);
});
