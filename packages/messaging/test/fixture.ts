import { expect } from "bun:test";
import type { RunClaim, RunRecord } from "@ground-control/store";
import { MemoryStore } from "@ground-control/store";
import type { TrustPort } from "../src/index.ts";
import {
  MemoryMessagingStore,
  MessagingCipher,
  MessagingHub,
  RecordingCorrection,
  RecordingIMessage,
} from "../src/index.ts";

export const repoName = "owner/project";
const sourceIds = ["readme", "wiki", "confluence"] as const;
export const claimIds = [
  "c_1111111111",
  "c_2222222222",
  "c_3333333333",
] as const;

function result(index: number, status: "pass" | "fail"): RunClaim {
  return {
    claimId: claimIds[index] ?? claimIds[0],
    sourceId: sourceIds[index] ?? sourceIds[0],
    quote: "The server uses port 3000",
    kind: "file_exists",
    params: { path: "server.js" },
    state: "confirmed",
    status,
    expected: "port 8080",
    actual: status === "fail" ? "port 3000" : "port 8080",
    deepLink: `https://example.com/${sourceIds[index] ?? "readme"}`,
  };
}

export function run(
  id: string,
  sha: string,
  status: "pass" | "fail",
  day: string,
): RunRecord {
  const command: RunClaim = {
    claimId: "c_4444444444",
    sourceId: "readme",
    quote: "Run npm run dev",
    kind: "command_succeeds",
    params: { command: "npm run dev" },
    state: "confirmed",
    status: "pass",
    expected: "exit 0",
    actual: "exit 0",
    deepLink: null,
  };
  return {
    id,
    repo: repoName,
    commitSha: sha,
    createdAt: `${day}T12:00:00Z`,
    verdict: status === "fail" ? "failure" : "success",
    results: [...sourceIds.map((_, index) => result(index, status)), command],
    evidence: [],
  };
}

export function fixture() {
  const appStore = new MemoryStore();
  const messages = new MemoryMessagingStore();
  const cipher = new MessagingCipher("secret");
  const imessage = new RecordingIMessage();
  const baseline = run("run_base", "abcdef0", "pass", "2026-09-25");
  const drift = run("run_drift", "abcdef1", "fail", "2026-09-26");
  appStore.putRepo({
    repo: repoName,
    visibility: "public",
    connected: true,
    tokenHash: null,
    label: "Drifting",
    driftDegrees: 75,
    latestRunId: drift.id,
  });
  for (const id of sourceIds)
    appStore.putSource({
      id,
      repo: repoName,
      kind:
        id === "confluence" ? "confluence" : id === "wiki" ? "wiki" : "readme",
      title: id,
      url: `https://example.com/${id}`,
      claimCount: 1,
    });
  appStore.putRun(baseline);
  appStore.putRun(drift);
  const correction = new RecordingCorrection({
    verified: false,
    delivered: ["confluence"],
    unavailable: ["readme", "wiki"],
    pullRequestUrl: null,
    passedCheckCount: 0,
  });
  const trustCalls: { repo: string; claimId: string; state: string }[] = [];
  const trust: TrustPort = {
    async set(repo, claimId, state) {
      trustCalls.push({ repo, claimId, state });
      return { ok: true, value: { failing: state === "confirmed" } };
    },
  };
  const scans: string[] = [];
  const hub = new MessagingHub({
    appStore,
    messages,
    cipher,
    imessage,
    correction,
    trust,
    scanner: {
      async scanNow(repo) {
        scans.push(repo);
      },
    },
    publicUrl: "http://localhost:8787",
    now: () => new Date("2026-09-26T12:00:00Z"),
  });
  return {
    hub,
    appStore,
    messages,
    cipher,
    imessage,
    correction,
    trustCalls,
    scans,
    drift,
    inbound(id: string, text: string) {
      return {
        id,
        senderId: "+15551234567",
        senderAddress: "+15551234567",
        chatId: "chat",
        linePhone: "+15550000000",
        text,
      };
    },
  };
}

export async function link(f: ReturnType<typeof fixture>) {
  expect((await f.hub.requestLink("navi", "+15551234567")).ok).toBe(true);
  expect(f.imessage.sent[0]?.text).toContain("@navi");
  const token = /LINK ([A-Za-z0-9_-]{32})/.exec(
    f.imessage.sent[0]?.text ?? "",
  )?.[1];
  if (!token) throw new Error("iMessage link challenge was not sent");
  expect(await f.hub.handleInbound(f.inbound("1", `LINK ${token}`))).toEqual({
    ok: true,
    value: "handled",
  });
}
