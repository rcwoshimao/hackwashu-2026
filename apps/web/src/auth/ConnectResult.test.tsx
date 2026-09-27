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
        runtimeEnabled: true,
        telemetryToken: "private-telemetry-token",
      }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /Private repository connected/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /private-telemetry-token/);
  assert.match(markup, /sources\/new\?repo=owner%2Fprivate/);
  assert.match(markup, /GitHub workflow/);
  assert.match(markup, /gh secret set GROUND_CONTROL_TOKEN -R owner\/private/);
  assert.match(markup, /Download workflow/);
  assert.match(markup, /Ground Control server URL is already filled in/);
  assert.doesNotMatch(markup, /Local checkout path|seed-plan|gh variable set/);
  assert.doesNotMatch(markup, /gh secret set[^<]*private-telemetry-token/);
});

test("public connection offers sources without Actions setup", () => {
  const markup = renderToStaticMarkup(
    <ConnectResult
      connection={{
        repo: "owner/public",
        visibility: "public",
        runtimeEnabled: false,
      }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /Public repository connected/);
  assert.match(markup, /sources\/new\?repo=owner%2Fpublic/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_TOKEN/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_URL/);
  assert.doesNotMatch(markup, /telemetry-token/);
  assert.doesNotMatch(markup, /seed-plan/);
});

test("personal public runtime opt-in shows its one-time Actions token", () => {
  const markup = renderToStaticMarkup(
    <ConnectResult
      connection={{
        repo: "owner/public",
        visibility: "public",
        runtimeEnabled: true,
        telemetryToken: "public-runtime-telemetry-token",
      }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /Deep checks enabled/);
  assert.match(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /public-runtime-telemetry-token/);
  assert.match(markup, /gh secret set GROUND_CONTROL_TOKEN -R owner\/public/);
});

test("reconnecting an opted-in public repository does not imply a new token", () => {
  const markup = renderToStaticMarkup(
    <ConnectResult
      connection={{
        repo: "owner/public",
        visibility: "public",
        runtimeEnabled: true,
      }}
      serverUrl="https://demo.example"
    />,
  );
  assert.match(markup, /already enabled/);
  assert.doesNotMatch(markup, /GROUND_CONTROL_TOKEN/);
  assert.match(markup, /Download workflow/);
});
