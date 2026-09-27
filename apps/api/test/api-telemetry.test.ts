import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { FakePrComments } from "@ground-control/fixes";
import { createApi } from "../src/index.ts";
import { json, login, setup } from "./fixture.ts";

describe("telemetry and messaging API", () => {
  test("public runtime telemetry requires explicit personal-repo opt-in", async () => {
    const { app, github, store } = setup();
    github.permission = {
      visibility: "public",
      canRead: true,
      canAdmin: true,
    };
    const cookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "maintainer/public" },
      { cookie },
    );
    expect(connected.status).toBe(201);
    const details = await connected.json();
    expect(details.visibility).toBe("public");
    expect(details).not.toHaveProperty("telemetryToken");
    expect(store.getRepo("maintainer/public")?.tokenHash).toBeNull();
    const repo = store.getRepo("maintainer/public");
    if (repo === null) throw new Error("missing connected public repo");
    const token = "legacy-public-token";
    store.putRepo({
      ...repo,
      tokenHash: createHash("sha256").update(token).digest("hex"),
    });
    const response = await json(
      app,
      "/api/telemetry",
      { repo: "maintainer/public", commitSha: "abcdef0", results: [] },
      { authorization: `Bearer ${token}` },
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "runtime_not_enabled",
    });
    expect(store.listRuns("maintainer/public")).toEqual([]);
    const enabled = await json(
      app,
      "/api/connect",
      { repo: "maintainer/public", runtime: true },
      { cookie },
    );
    expect(enabled.status).toBe(201);
    const enabledToken = (await enabled.json()).telemetryToken as string;
    expect(enabledToken.length).toBeGreaterThan(20);
    expect(store.getRepo("maintainer/public")?.runtimeEnabled).toBe(true);
    const report = await json(
      app,
      "/api/telemetry",
      { repo: "maintainer/public", commitSha: "abcdef0", results: [] },
      { authorization: `Bearer ${enabledToken}` },
    );
    expect(report.status).toBe(201);
    expect(store.listRuns("maintainer/public")).toHaveLength(1);
  });

  test("scoped telemetry and confirmation determine verdict", async () => {
    const { app } = setup();
    const cookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie },
    );
    const details = await connected.json();
    expect(details.visibility).toBe("private");
    const token = details.telemetryToken as string;
    const payload = {
      repo: "owner/project",
      commitSha: "abcdef0",
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
          deepLink: null,
        },
      ],
    };
    expect(
      (
        await json(app, "/api/telemetry", payload, {
          authorization: "Bearer wrong",
        })
      ).status,
    ).toBe(401);
    const posted = await json(app, "/api/telemetry", payload, {
      authorization: `Bearer ${token}`,
    });
    expect(posted.status).toBe(201);
    const runId = (await posted.json()).id as string;
    const initial = await (
      await app.request(`/api/runs/${runId}`, { headers: { cookie } })
    ).json();
    expect(initial.verdict).toBe("success");
    expect(initial.results[0].state).toBe("disputed");
    const confirmed = await json(
      app,
      `/api/runs/${runId}/claims/c_1234567890/confirm`,
      {},
      { cookie },
    );
    expect((await confirmed.json()).latestVerdict).toBe("failure");
    const after = await (
      await app.request(`/api/runs/${runId}`, { headers: { cookie } })
    ).json();
    expect(after.evidence[0].claims[0].claimId).toBe("c_1234567890");
    const dropped = await json(
      app,
      `/api/runs/${runId}/claims/c_1234567890/drop`,
      {},
      { cookie },
    );
    expect((await dropped.json()).latestVerdict).toBe("success");
  });

  test("telemetry passes verified author and changed-code flags to messaging", async () => {
    const { store, auth, events } = setup();
    const calls: { author: string; codeChanged: boolean }[] = [];
    const app = createApi({
      store,
      auth,
      events,
      now: () => new Date(),
      publicUrl: "http://localhost:8787",
      commitAuthor: {
        async lookup() {
          return { ok: true, login: "navi" };
        },
      },
      messaging: {
        async alert(_run, author, codeChanged) {
          calls.push({ author, codeChanged });
          return { ok: true, value: { sent: false, alertId: null } };
        },
      },
    });
    const cookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie },
    );
    const token = (await connected.json()).telemetryToken as string;
    const telemetry = await json(
      app,
      "/api/telemetry",
      {
        repo: "owner/project",
        commitSha: "abcdef0",
        authorLogin: "navi",
        codeChanged: true,
        docsChanged: false,
        changedFiles: ["src/server.ts"],
        results: [],
      },
      { authorization: `Bearer ${token}` },
    );
    expect(telemetry.status).toBe(201);
    expect(calls).toEqual([{ author: "navi", codeChanged: true }]);
  });

  test("PR evidence comment is sent only for a confirmed failing run", async () => {
    const { store, auth, events } = setup();
    const prComments = new FakePrComments();
    const app = createApi({
      store,
      auth,
      events,
      prComments,
      now: () => new Date(),
      publicUrl: "http://localhost:8787",
    });
    const cookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie },
    );
    const token = (await connected.json()).telemetryToken as string;
    const result = {
      claimId: "c_1234567890",
      sourceId: "README.md",
      quote: "Install setup.sh",
      kind: "file_exists",
      params: { path: "setup.sh" },
      status: "fail",
      expected: "setup.sh exists",
      actual: "missing",
      deepLink: null,
    };
    const firstSha = "a".repeat(40);
    prComments.heads.set("owner/project\n7", firstSha);
    const send = (commitSha: string) =>
      json(
        app,
        "/api/telemetry",
        {
          repo: "owner/project",
          commitSha,
          pullRequestNumber: 7,
          results: [result],
        },
        { authorization: `Bearer ${token}` },
      );
    const first = await send(firstSha);
    expect(first.status).toBe(201);
    expect(prComments.actions).toEqual([]);
    const runId = (await first.json()).id as string;
    expect(store.getRun(runId)?.pullRequestNumber).toBe(7);
    const confirmed = await json(
      app,
      `/api/runs/${runId}/claims/${result.claimId}/confirm`,
      {},
      { cookie },
    );
    expect(confirmed.status).toBe(200);
    expect(prComments.actions).toEqual(["created"]);
    const secondSha = "b".repeat(40);
    prComments.heads.set("owner/project\n7", secondSha);
    expect((await send(secondSha)).status).toBe(201);
    expect(prComments.actions).toEqual(["created", "updated"]);
    expect(prComments.comments.get("owner/project\n7")).toContain(
      "Install setup.sh",
    );
  });

  test("iMessage link challenge needs sign-in and is limited to three per hour", async () => {
    const { store, auth, events } = setup();
    const requests: { login: string; phone: string }[] = [];
    const app = createApi({
      store,
      auth,
      events,
      now: () => new Date("2026-09-26T12:00:00Z"),
      publicUrl: "http://localhost:8787",
      messaging: {
        async alert() {
          return { ok: true, value: { sent: false, alertId: null } };
        },
        async requestLink(login, phone) {
          requests.push({ login, phone });
          return { ok: true, value: undefined };
        },
      },
    });
    expect(
      (await json(app, "/api/imessage/link", { phone: "+15551234567" })).status,
    ).toBe(401);
    const cookie = await login(app);
    expect(
      (
        await json(
          app,
          "/api/imessage/link",
          { phone: "555-123-4567" },
          { cookie },
        )
      ).status,
    ).toBe(400);
    for (let count = 0; count < 3; count += 1) {
      const response = await json(
        app,
        "/api/imessage/link",
        { phone: "+15551234567" },
        { cookie },
      );
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ status: "sent" });
    }
    expect(
      (
        await json(
          app,
          "/api/imessage/link",
          { phone: "+15551234567" },
          { cookie },
        )
      ).status,
    ).toBe(429);
    expect(requests).toEqual(
      Array.from({ length: 3 }, () => ({
        login: "maintainer",
        phone: "+15551234567",
      })),
    );
  });

  test("iMessage linking stays unavailable without configured messaging", async () => {
    const { app } = setup();
    const cookie = await login(app);
    const response = await json(
      app,
      "/api/imessage/link",
      { phone: "+15551234567" },
      { cookie },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "imessage_unavailable" });
  });

  test("iMessage delivery failure never returns a link code", async () => {
    const { store, auth, events } = setup();
    const app = createApi({
      store,
      auth,
      events,
      now: () => new Date(),
      publicUrl: "http://localhost:8787",
      messaging: {
        async alert() {
          return { ok: true, value: { sent: false, alertId: null } };
        },
        async requestLink() {
          return { ok: false, error: { code: "send_failed" } };
        },
      },
    });
    const cookie = await login(app);
    const response = await json(
      app,
      "/api/imessage/link",
      { phone: "+15551234567" },
      { cookie },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "imessage_unavailable" });
  });
});
