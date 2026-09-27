import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectResult } from "./ConnectResult.tsx";

test("private connection shows the Actions token and source link", () => {
  const markup = renderToStaticMarkup(
    <ConnectResult
      connection={{
        repo: "owner/private",
        visibility: "private",
        telemetryToken: "private-telemetry-token",
      }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /Private repository connected/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /private-telemetry-token/);
  assert.match(markup, /sources\/new\?repo=owner%2Fprivate/);
});

test("public connection offers sources without Actions setup", () => {
  const markup = renderToStaticMarkup(
    <ConnectResult
      connection={{ repo: "owner/public", visibility: "public" }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /Public repository connected/);
  assert.match(markup, /sources\/new\?repo=owner%2Fpublic/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_TOKEN/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_URL/);
  assert.doesNotMatch(markup, /telemetry-token/);
});
