import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MeData, RepoData } from "../data.ts";
import { DeepCheckLink } from "./DeepCheckLink.tsx";

const repo: RepoData = {
  repo: "owner/project",
  visibility: "public",
  runtimeEnabled: false,
  label: "No telemetry",
  driftDegrees: 0,
  latestRunId: null,
  scan: null,
  sources: [],
  runs: [],
};
const owner: MeData = {
  signedIn: true,
  login: "owner",
  connectedRepos: [repo.repo],
};

test("owned public findings link to prefilled deep-scan setup", () => {
  const markup = renderToStaticMarkup(<DeepCheckLink data={repo} me={owner} />);
  assert.match(markup, /Add deep scan/);
  assert.match(markup, /connect\?repo=owner%2Fproject&amp;runtime=1/);
});

test("enabled repositories open setup without an opt-in label", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink data={{ ...repo, runtimeEnabled: true }} me={owner} />,
  );
  assert.match(markup, /Set up deep checks/);
  assert.doesNotMatch(markup, /Add deep scan/);
});

test("other public repositories do not offer owner-only deep checks", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink data={repo} me={{ ...owner, login: "someone" }} />,
  );
  assert.equal(markup, "");
});

test("connected private repositories can revisit setup", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink
      data={{ ...repo, visibility: "private", runtimeEnabled: true }}
      me={{ ...owner, login: "someone" }}
    />,
  );
  assert.match(markup, /Set up deep checks/);
});
