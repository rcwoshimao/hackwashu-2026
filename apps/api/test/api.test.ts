import { describe, expect, test } from "bun:test";
import { createApi, seedLocalDemo } from "../src/index.ts";
import { json, login, setup } from "./fixture.ts";

describe("local API", () => {
  test("health and honest simulated sky", async () => {
    const { app, store } = setup();
    seedLocalDemo(store, new Date("2026-09-26T12:00:00Z"));
    seedLocalDemo(store, new Date());
    expect(await (await app.request("/healthz")).text()).toBe("ok");
    const sky = await (await app.request("/api/sky")).json();
    expect(sky.findings).toEqual({
      realCount: 0,
      driftingCount: 0,
      medianLagDays: null,
    });
    expect(sky.satellites).toHaveLength(3);
    expect(
      sky.satellites.every((item: { simulated: boolean }) => item.simulated),
    ).toBe(true);
  });

  test("OAuth session gates private routes and signout", async () => {
    const { app, store, github } = setup();
    store.putRepo({
      repo: "owner/private",
      visibility: "private",
      connected: true,
      tokenHash: null,
      label: "No telemetry",
      driftDegrees: 0,
      latestRunId: null,
    });
    expect((await app.request("/api/repos/owner/private")).status).toBe(401);
    const cookie = await login(app);
    expect((await app.request("/api/me", { headers: { cookie } })).status).toBe(
      200,
    );
    expect(
      (await app.request("/api/repos/owner/private", { headers: { cookie } }))
        .status,
    ).toBe(200);
    expect(github.calls).toBe(1);
    github.permission = {
      visibility: "private",
      canRead: false,
      canAdmin: false,
    };
    const logout = await app.request("/auth/signout", {
      method: "POST",
      headers: { cookie },
    });
    expect(logout.status).toBe(200);
    expect(await logout.json()).toEqual({ signedIn: false });
    expect(
      (await app.request("/api/repos/owner/private", { headers: { cookie } }))
        .status,
    ).toBe(401);
  });

  test("connect requires admin and source requires access", async () => {
    const { app, github, store } = setup();
    const cookie = await login(app);
    github.permission = {
      visibility: "public",
      canRead: true,
      canAdmin: false,
    };
    expect(
      (await json(app, "/api/connect", { repo: "owner/project" }, { cookie }))
        .status,
    ).toBe(403);
    github.permission = { visibility: "public", canRead: true, canAdmin: true };
    // A new session avoids the 10-minute permission cache after an admin grant.
    const secondCookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie: secondCookie },
    );
    expect(connected.status).toBe(201);
    const connection = await connected.json();
    expect(connection).toMatchObject({
      repo: "owner/project",
      visibility: "public",
    });
    expect(connection).not.toHaveProperty("telemetryToken");
    expect(store.getRepo("owner/project")?.tokenHash).toBeNull();
    const previous = store.getRepo("owner/project");
    if (previous === null) throw new Error("missing connected repo");
    store.putRepo({ ...previous, tokenHash: "old-private-token-hash" });
    const reconnected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie: secondCookie },
    );
    expect((await reconnected.json()).telemetryToken).toBeUndefined();
    expect(store.getRepo("owner/project")?.tokenHash).toBeNull();
    const source = await json(
      app,
      "/api/sources",
      {
        repo: "owner/project",
        kind: "url",
        url: "https://example.com/guide",
      },
      { cookie: secondCookie },
    );
    expect(source.status).toBe(201);
  });

  test("private connection stays private when GitHub visibility changes", async () => {
    const { app, github, store } = setup();
    const privateCookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie: privateCookie },
    );
    expect(connected.status).toBe(201);
    const details = await connected.json();
    expect(details.visibility).toBe("private");
    const oldToken = details.telemetryToken as string;
    const before = store.getRepo("owner/project");
    if (before === null) throw new Error("missing private repo");
    expect(before?.tokenHash).toBeTruthy();
    github.permission = {
      visibility: "public",
      canRead: true,
      canAdmin: true,
    };
    const publicCookie = await login(app);
    const reconnected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie: publicCookie },
    );
    expect(reconnected.status).toBe(409);
    expect(await reconnected.json()).toEqual({
      error: "repository_visibility_changed",
    });
    expect(store.getRepo("owner/project")).toEqual({
      ...before,
      tokenHash: null,
    });
    expect((await app.request("/api/repos/owner/project")).status).toBe(401);
    expect(
      (
        await app.request("/api/repos/owner/project", {
          headers: { cookie: publicCookie },
        })
      ).status,
    ).toBe(403);
    const me = await app.request("/api/me", {
      headers: { cookie: publicCookie },
    });
    expect((await me.json()).connectedRepos).toEqual([]);
    const telemetry = await json(
      app,
      "/api/telemetry",
      { repo: "owner/project", commitSha: "abcdef0", results: [] },
      { authorization: `Bearer ${oldToken}` },
    );
    expect(telemetry.status).toBe(401);
  });

  test("public anonymous scans stop at five per hour", async () => {
    const { app, scans } = setup();
    for (let index = 0; index < 5; index += 1) {
      expect(
        (await json(app, "/api/scan", { repo: "owner/public" })).status,
      ).toBe(202);
    }
    expect(
      (await json(app, "/api/scan", { repo: "owner/public" })).status,
    ).toBe(429);
    expect(scans).toHaveLength(5);
  });

  test("scanner rejects an unknown private repository", async () => {
    const { store, auth, events } = setup();
    const app = createApi({
      store,
      auth,
      events,
      now: () => new Date(),
      publicUrl: "http://localhost:8787",
      scanner: {
        async scan() {
          throw new Error("not_public");
        },
      },
    });
    const response = await json(app, "/api/scan", { repo: "owner/private" });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "private_scan_requires_connection",
    });
  });

  test("SSE streams stored changes with an event cursor", async () => {
    const { app, store, events } = setup();
    const response = await app.request("/api/events");
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    if (reader === undefined) return;
    expect(new TextDecoder().decode((await reader.read()).value)).toContain(
      ": connected",
    );
    const event = store.appendEvent("scan", "2026-09-26T12:00:00Z", {
      repo: "owner/public",
    });
    events.publish(event);
    const frame = new TextDecoder().decode((await reader.read()).value);
    expect(frame).toContain("id: 1");
    expect(frame).toContain("event: scan");
    await reader.cancel();
  });
});
