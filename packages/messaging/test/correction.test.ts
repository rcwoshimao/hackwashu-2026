import { expect, test } from "bun:test";
import { FixtureConfluence } from "@ground-control/sources";
import type { RunRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import type { AlertRecord } from "../src/index.ts";
import {
  ConfluenceCorrection,
  RecordingCorrection,
  UnavailableCorrection,
} from "../src/index.ts";

const run: RunRecord = {
  id: "run_1",
  repo: "owner/project",
  commitSha: "abcdef0",
  createdAt: "2026-09-26T12:00:00Z",
  verdict: "failure",
  evidence: [],
  results: [
    {
      claimId: "c_1234567890",
      sourceId: "confluence",
      quote: "Port 3000",
      kind: "file_exists",
      params: { path: "server.js" },
      state: "confirmed",
      status: "fail",
      expected: "port <8080>",
      actual: "port & 3000",
      deepLink: null,
    },
  ],
};
const alert: AlertRecord = {
  id: "drift_1",
  githubLogin: "navi",
  repo: run.repo,
  commitSha: run.commitSha,
  runId: run.id,
  claimIds: ["c_1234567890"],
  sourceIds: ["confluence", "wiki"],
  state: "open",
  delivery: "sent",
  createdAt: run.createdAt,
};

test("FIX posts an escaped Confluence footer comment and reports other sources unavailable", async () => {
  const appStore = new MemoryStore();
  appStore.putSource({
    id: "confluence",
    repo: run.repo,
    kind: "confluence",
    title: "Setup",
    url: "https://team.atlassian.net/wiki/spaces/GC/pages/123/Setup",
    claimCount: 1,
  });
  appStore.putSource({
    id: "wiki",
    repo: run.repo,
    kind: "wiki",
    title: "Wiki setup",
    url: "https://github.com/owner/project/wiki/Setup",
    claimCount: 1,
  });
  const confluence = new FixtureConfluence(
    new Map([
      [
        "123",
        {
          id: "123",
          version: 1,
          storageHtml: "<p>Original page</p>",
        },
      ],
    ]),
  );
  const correction = new ConfluenceCorrection(
    confluence,
    "http://localhost:8787",
  );
  const result = await correction.fix(alert, run, appStore);
  expect(result).toMatchObject({
    ok: true,
    value: {
      verified: false,
      delivered: ["confluence"],
      unavailable: ["wiki"],
      pullRequestUrl: null,
    },
  });
  expect(confluence.comments).toHaveLength(1);
  expect(confluence.comments[0]?.storageHtml).toContain("&lt;8080&gt;");
  expect(confluence.comments[0]?.storageHtml).toContain("&amp; 3000");
  expect(confluence.comments[0]?.storageHtml).toContain("/runs/run_1");
  expect((await confluence.readPage("123")).ok).toBe(true);
});

test("unavailable and recording corrections never imply a verified PR", async () => {
  const appStore = new MemoryStore();
  expect(await new UnavailableCorrection().fix()).toEqual({
    ok: false,
    error: { code: "unavailable" },
  });
  const recording = new RecordingCorrection({
    verified: false,
    delivered: [],
    unavailable: ["readme"],
    pullRequestUrl: null,
    passedCheckCount: 0,
  });
  const result = await recording.fix(alert, run, appStore);
  expect(result).toMatchObject({
    ok: true,
    value: { verified: false, pullRequestUrl: null },
  });
  expect(recording.calls).toHaveLength(1);
});
