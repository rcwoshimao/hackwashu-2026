import { expect, test } from "bun:test";
import { FakePrComments } from "@ground-control/fixes";
import { MemoryStore } from "@ground-control/store";
import { postPrEvidence } from "../src/messaging.ts";
import { ingestTelemetry, refreshTrust } from "../src/telemetry.ts";
import { EventHub } from "../src/types.ts";

test("confirming a disputed PR claim posts one comment for its head", async () => {
  const repo = "owner/project";
  const sha = "a".repeat(40);
  const store = new MemoryStore();
  store.putRepo({
    repo,
    visibility: "public",
    connected: true,
    tokenHash: "registered",
    label: "No telemetry",
    driftDegrees: 0,
    latestRunId: null,
  });
  const run = ingestTelemetry(
    store,
    {
      repo,
      commitSha: sha,
      pullRequestNumber: 7,
      results: [
        {
          claimId: "c_1234567890",
          sourceId: "README.md",
          quote: "Install setup.sh",
          kind: "file_exists",
          params: { path: "setup.sh" },
          status: "fail",
          expected: "setup.sh exists",
          actual: "missing",
        },
      ],
    },
    new Date("2026-09-26T12:00:00Z"),
  );
  const prComments = new FakePrComments();
  prComments.heads.set(`${repo}\n7`, sha);
  const config = {
    store,
    events: new EventHub(),
    publicUrl: "https://ground.example",
    prComments,
  };
  await postPrEvidence(config, run);
  expect(prComments.comments.size).toBe(0);
  const confirmed = refreshTrust(store, repo, "c_1234567890", "confirmed");
  if (!confirmed) throw new Error("Expected refreshed run");
  await postPrEvidence(config, confirmed);
  await postPrEvidence(config, confirmed);
  expect(prComments.actions).toEqual(["created", "unchanged"]);
  expect(prComments.comments.get(`${repo}\n7`)).toContain("Install setup.sh");
});
