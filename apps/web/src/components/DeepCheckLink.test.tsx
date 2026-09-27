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

test("owned public findings link to prefilled deep-check setup", () => {
  const markup = renderToStaticMarkup(<DeepCheckLink data={repo} me={owner} />);
  assert.match(markup, /Set up deep checks/);
  assert.match(markup, /connect\?repo=owner%2Fproject&amp;runtime=1/);
});

test("enabled repositories open setup without an opt-in label", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink
      data={{
        ...repo,
        runtimeEnabled: true,
        runs: [
          {
            id: "public",
            commitSha: "abc",
            createdAt: "2026-09-27T02:00:00Z",
            verdict: "success",
            origin: "public_scan",
            failingCount: 0,
          },
        ],
      }}
      me={owner}
    />,
  );
  assert.match(markup, /Review deep check setup/);
  assert.doesNotMatch(markup, /Set up deep checks/);
  assert.match(markup, /No CI result received yet/);
});

test("a successful CI report confirms deep-check setup despite a newer public scan", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink
      data={{
        ...repo,
        runtimeEnabled: true,
        runs: [
          {
            id: "public",
            commitSha: "abc",
            createdAt: "2026-09-27T02:00:00Z",
            verdict: "success",
            origin: "public_scan",
            failingCount: 0,
          },
          {
            id: "ci-pass",
            commitSha: "def",
            createdAt: "2026-09-27T01:00:00Z",
            verdict: "success",
            origin: "ci",
            failingCount: 0,
          },
        ],
      }}
      me={owner}
    />,
  );
  assert.match(markup, /Deep checks set up/);
  assert.match(markup, /Latest CI run passed/);
  assert.match(markup, /runs\/ci-pass/);
  assert.doesNotMatch(markup, /Review deep check setup/);
});

test("a saved CI report confirms setup even when the opt-in flag is stale", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink
      data={{
        ...repo,
        runs: [
          {
            id: "ci-pass",
            commitSha: "def",
            createdAt: "2026-09-27T01:00:00Z",
            verdict: "success",
            origin: "ci",
            failingCount: 0,
          },
        ],
      }}
      me={owner}
    />,
  );
  assert.match(markup, /Deep checks set up/);
  assert.doesNotMatch(markup, /Set up deep checks/);
});

test("a failing latest CI run confirms reporting without claiming checks passed", () => {
  const markup = renderToStaticMarkup(
    <DeepCheckLink
      data={{
        ...repo,
        runtimeEnabled: true,
        runs: [
          {
            id: "ci-fail",
            commitSha: "abc",
            createdAt: "2026-09-27T02:00:00Z",
            verdict: "failure",
            origin: "ci",
            failingCount: 1,
          },
          {
            id: "ci-pass",
            commitSha: "def",
            createdAt: "2026-09-27T01:00:00Z",
            verdict: "success",
            origin: "ci",
            failingCount: 0,
          },
        ],
      }}
      me={owner}
    />,
  );
  assert.match(markup, /Deep checks set up/);
  assert.match(markup, /Latest CI run found drift/);
  assert.match(markup, /runs\/ci-fail/);
  assert.doesNotMatch(markup, /Latest CI run passed/);
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
  assert.match(markup, /Review deep check setup/);
});
