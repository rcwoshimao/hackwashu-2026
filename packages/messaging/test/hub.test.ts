import { describe, expect, test } from "bun:test";
import { claimIds, fixture, link, repoName, run } from "./fixture.ts";

describe("message loop", () => {
  test("one grouped alert per breaking commit; FIX reports only delivered work", async () => {
    const f = fixture();
    await link(f);
    expect((await f.hub.alert(f.drift, "navi", false)).ok).toBe(true);
    expect(f.imessage.replies).toHaveLength(1);
    expect((await f.hub.alert(f.drift, "navi", true)).ok).toBe(true);
    expect(f.imessage.replies).toHaveLength(2);
    expect(f.imessage.replies[1]?.text).toContain("3 docs");
    expect(f.imessage.replies[1]?.text).toContain("readme, wiki, confluence");
    expect(f.imessage.replies[1]?.linePhone).toBe("+15550000000");
    await f.hub.alert(f.drift, "navi", true);
    expect(f.imessage.replies).toHaveLength(2);
    const handled = await f.hub.handleInbound(f.inbound("2", "FIX"));
    expect(handled).toEqual({ ok: true, value: "handled" });
    expect(f.correction.calls).toHaveLength(1);
    expect(f.imessage.replies.at(-1)?.text).toContain("1 source updates");
    expect(f.imessage.replies.at(-1)?.text).not.toContain("Pull request");
    const alert = f.messages.listAlerts("navi")[0];
    expect(alert?.state).toBe("fixing");
  });

  test("inbound IDs dedupe, CONFIRM/DROP act only on owned claims, and stop unlinks", async () => {
    const f = fixture();
    await link(f);
    await f.hub.alert(f.drift, "navi", true);
    const confirm = f.inbound("2", "CONFIRM c_1111111111");
    expect(await f.hub.handleInbound(confirm)).toEqual({
      ok: true,
      value: "handled",
    });
    expect(await f.hub.handleInbound(confirm)).toEqual({
      ok: true,
      value: "duplicate",
    });
    expect(f.trustCalls).toHaveLength(1);
    expect(f.imessage.replies.at(-1)?.text).toContain("Reply FIX");
    await f.hub.handleInbound(f.inbound("3", "DROP c_2222222222"));
    expect(f.trustCalls[1]).toMatchObject({
      claimId: "c_2222222222",
      state: "dropped",
    });
    await f.hub.handleInbound(f.inbound("4", "DROP c_9999999999"));
    expect(f.imessage.replies.at(-1)?.text).toContain("couldn't find");
    await f.hub.handleInbound(f.inbound("5", "stop"));
    expect(f.messages.getLinkByGithub("navi")).toBeNull();
    expect(await f.hub.handleInbound(f.inbound("6", "status"))).toEqual({
      ok: true,
      value: "ignored",
    });
  });

  test("status, verified run steps, repo scan, and KEEP stay scoped", async () => {
    const f = fixture();
    await link(f);
    await f.hub.alert(f.drift, "navi", true);
    await f.hub.handleInbound(f.inbound("2", "status"));
    expect(f.imessage.replies.at(-1)?.text).toContain(
      "owner/project: Drifting",
    );
    await f.hub.handleInbound(f.inbound("3", "run owner/project"));
    expect(f.imessage.replies.at(-1)?.text).toContain("npm run dev");
    await f.hub.handleInbound(
      f.inbound("4", "https://github.com/owner/project"),
    );
    expect(f.imessage.replies.at(-1)?.text).toContain("Scanned 4 claims");
    await f.hub.handleInbound(f.inbound("5", "KEEP"));
    expect(f.messages.listAlerts("navi")[0]?.state).toBe("kept");
    expect(f.appStore.getRun(f.drift.id)?.verdict).toBe("failure");
    const second = run("run_next", "abcdef2", "fail", "2026-09-27");
    f.appStore.putRun(second);
    await f.hub.alert(second, "navi", true);
    expect(
      f.imessage.replies.filter((reply) =>
        reply.text.includes("confirmed failing checks"),
      ),
    ).toHaveLength(1);
  });

  test("IGNORE suppresses repeat alerts until the documented claim changes", async () => {
    const f = fixture();
    await link(f);
    await f.hub.alert(f.drift, "navi", true);
    await f.hub.handleInbound(f.inbound("2", "IGNORE"));
    expect(f.messages.listAlerts("navi")[0]?.state).toBe("ignored");
    for (const id of claimIds)
      expect(f.messages.isIgnored(repoName, id)).toBe(true);
    const repeat = run("run_repeat", "abcdef2", "fail", "2026-09-27");
    f.appStore.putRun(repeat);
    await f.hub.alert(repeat, "navi", true);
    expect(
      f.imessage.replies.filter((reply) =>
        reply.text.includes("confirmed failing checks"),
      ),
    ).toHaveLength(1);
    expect(f.appStore.getRun(repeat.id)?.verdict).toBe("failure");
    const changedOriginal = run("run_changed", "abcdef3", "fail", "2026-09-28");
    const first = changedOriginal.results[0];
    if (!first) throw new Error("missing fixture claim");
    const changed = {
      ...changedOriginal,
      results: [
        {
          ...first,
          claimId: "c_5555555555",
          quote: "The server uses port 8080",
        },
        ...changedOriginal.results.slice(1),
      ],
    };
    f.appStore.putRun(changed);
    await f.hub.alert(changed, "navi", true);
    const alerts = f.imessage.replies.filter((reply) =>
      reply.text.includes("confirmed failing checks"),
    );
    expect(alerts).toHaveLength(2);
    expect(alerts[1]?.text).toContain("1 doc");
    expect(alerts[1]?.text).toContain("readme");
    expect(alerts[1]?.text).not.toContain("wiki, confluence");
  });

  test("an unlinked iMessage sender can ask about public repos only", async () => {
    const f = fixture();
    const stranger = {
      senderId: "+15557654321",
      senderAddress: "+15557654321",
      chatId: "stranger-dm",
      linePhone: "+15550000000",
    };
    const publicReply = await f.hub.handleInbound({
      ...stranger,
      id: "public",
      text: "https://github.com/owner/project",
    });
    expect(publicReply).toEqual({ ok: true, value: "handled" });
    expect(f.imessage.replies.at(-1)?.text).toContain("Scanned 4 claims");
    f.appStore.putRepo({
      repo: "owner/private",
      visibility: "private",
      connected: true,
      tokenHash: null,
      label: "Drifting",
      driftDegrees: 75,
      latestRunId: f.drift.id,
    });
    await f.hub.handleInbound({
      ...stranger,
      id: "private",
      text: "https://github.com/owner/private",
    });
    expect(f.imessage.replies.at(-1)?.text).not.toContain("Scanned 4 claims");
    await f.hub.handleInbound({
      ...stranger,
      id: "new-repo",
      text: "https://github.com/owner/new-repo",
    });
    expect(f.scans).toEqual(["owner/new-repo"]);
    await f.hub.handleInbound({
      ...stranger,
      id: "second-new-repo",
      text: "https://github.com/owner/other-repo",
    });
    expect(f.scans).toEqual(["owner/new-repo"]);
  });
});
