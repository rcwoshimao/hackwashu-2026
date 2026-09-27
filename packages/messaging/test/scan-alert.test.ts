import { expect, test } from "bun:test";
import type { RunRecord } from "@ground-control/store";
import type { ScanFixPort, TrustPort } from "../src/index.ts";
import { MessagingHub } from "../src/index.ts";
import { fixture, link } from "./fixture.ts";

const repo = "navi/docs";

function scanRun(): RunRecord {
  return {
    id: "run_scan",
    repo,
    commitSha: "abcdef9",
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "success",
    origin: "public_scan",
    results: [
      {
        claimId: "c_aaaaaaaaaa",
        sourceId: "readme_1",
        kind: "file_exists",
        params: { path: "docs/setup.md" },
        quote: "See docs/setup.md",
        state: "disputed",
        status: "fail",
        expected: "{}",
        actual: "fail",
        deepLink: null,
      },
      {
        claimId: "c_bbbbbbbbbb",
        sourceId: "readme_1",
        kind: "script_exists",
        params: { script: "serve" },
        quote: "npm run serve",
        state: "disputed",
        status: "fail",
        expected: "{}",
        actual: "fail",
        deepLink: null,
      },
      {
        claimId: "c_cccccccccc",
        sourceId: "readme_1",
        kind: "script_exists",
        params: { script: "test" },
        quote: "npm test",
        state: "confirmed",
        status: "pass",
        expected: "{}",
        actual: "pass",
        deepLink: null,
      },
    ],
    evidence: [],
  };
}

function scanFixture(fix?: ScanFixPort) {
  const f = fixture();
  const scanTrustCalls: { claimId: string; state: string }[] = [];
  const trust: TrustPort = {
    async set(_repo, claimId, state) {
      scanTrustCalls.push({ claimId, state });
      return { ok: true, value: { failing: false } };
    },
  };
  const hub = new MessagingHub({
    appStore: f.appStore,
    messages: f.messages,
    cipher: f.cipher,
    imessage: f.imessage,
    correction: f.correction,
    trust,
    ...(fix ? { scanFix: fix } : {}),
    publicUrl: "http://localhost:8787",
    now: () => new Date("2026-09-26T12:00:00Z"),
  });
  const run = scanRun();
  f.appStore.putRun(run);
  return { ...f, hub, scanTrustCalls, run };
}

test("a scan alert lists findings once and IGNORE drops them", async () => {
  const f = scanFixture();
  await link(f);
  const sent = await f.hub.scanAlert(f.run, "navi");
  expect(sent).toEqual({
    ok: true,
    value: { sent: true, alertId: expect.any(String) },
  });
  const text = f.imessage.replies.at(-1)?.text ?? "";
  expect(text).toContain("navi/docs");
  expect(text).toContain("2 possible README mismatches");
  expect(text).toContain("docs/setup.md not found");
  expect(text).toContain('no "serve" script');
  expect(text).not.toContain("npm test");
  const repliesBefore = f.imessage.replies.length;
  expect(await f.hub.scanAlert(f.run, "navi")).toEqual({
    ok: true,
    value: { sent: false, alertId: expect.any(String) },
  });
  expect(f.imessage.replies).toHaveLength(repliesBefore);

  await f.hub.handleInbound(f.inbound("2", "IGNORE"));
  expect(f.scanTrustCalls).toEqual([
    { claimId: "c_aaaaaaaaaa", state: "dropped" },
    { claimId: "c_bbbbbbbbbb", state: "dropped" },
  ]);
  expect(f.messages.isIgnored(repo, "c_aaaaaaaaaa")).toBe(true);
  expect(f.imessage.replies.at(-1)?.text).toContain("Ignored 2 findings");
});

test("FIX drafts a pull request through the scan fix port", async () => {
  const requested: string[][] = [];
  const f = scanFixture({
    async fix(_run, claimIds) {
      requested.push([...claimIds]);
      return {
        ok: true,
        value: {
          pullRequestUrl: "https://github.com/navi/docs/pull/3",
          fixedClaimIds: claimIds.slice(0, 1),
        },
      };
    },
  });
  await link(f);
  await f.hub.scanAlert(f.run, "navi");
  await f.hub.handleInbound(f.inbound("2", "fix"));
  expect(requested).toEqual([["c_aaaaaaaaaa", "c_bbbbbbbbbb"]]);
  const replies = f.imessage.replies.map((item) => item.text);
  expect(replies.at(-2)).toContain("Drafting a README correction");
  expect(replies.at(-1)).toContain("https://github.com/navi/docs/pull/3");
  expect(replies.at(-1)).toContain("1 of 2 findings");
  expect(f.messages.listAlerts("navi")[0]?.state).toBe("fixing");
});

test("FIX without a configured model points to the evidence", async () => {
  const f = scanFixture();
  await link(f);
  await f.hub.scanAlert(f.run, "navi");
  await f.hub.handleInbound(f.inbound("2", "FIX"));
  expect(f.imessage.replies.at(-1)?.text).toContain(
    "http://localhost:8787/runs/run_scan",
  );
  expect(f.messages.listAlerts("navi")[0]?.state).toBe("open");
});

test("KEEP closes the scan alert without changing trust", async () => {
  const f = scanFixture();
  await link(f);
  await f.hub.scanAlert(f.run, "navi");
  await f.hub.handleInbound(f.inbound("2", "KEEP"));
  expect(f.scanTrustCalls).toEqual([]);
  expect(f.messages.listAlerts("navi")[0]?.state).toBe("kept");
});

test("no scan alert for CI runs or unlinked users", async () => {
  const f = scanFixture();
  expect(await f.hub.scanAlert(f.run, "navi")).toEqual({
    ok: true,
    value: { sent: false, alertId: null },
  });
  await link(f);
  expect(await f.hub.scanAlert({ ...f.run, origin: "ci" }, "navi")).toEqual({
    ok: true,
    value: { sent: false, alertId: null },
  });
});
