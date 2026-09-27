import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectToken } from "./ConnectToken.tsx";

test("connect setup presents the returned token and exact Actions settings", () => {
  const markup = renderToStaticMarkup(
    <ConnectToken token="one-time-telemetry-token" repo="owner/repo" />,
  );
  assert.match(markup, /type="password"/);
  assert.match(markup, /value="one-time-telemetry-token"/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_URL/);
  assert.match(markup, /gh secret set GROUND_CONTROL_TOKEN -R owner\/repo/);
  assert.doesNotMatch(markup, /--body.*one-time-telemetry-token/);
});

test("token command does not embed a server URL or token", () => {
  const markup = renderToStaticMarkup(
    <ConnectToken token="one-time-telemetry-token" repo="owner/repo" />,
  );
  assert.doesNotMatch(markup, /localhost|GROUND_CONTROL_URL|gh variable set/);
});
