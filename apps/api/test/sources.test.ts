import { describe, expect, test } from "bun:test";
import { json, login, setup } from "./fixture.ts";

describe("connected source routes", () => {
  test("connect discovers README and docs, refreshes, and builds a combined plan", async () => {
    const files = new Map([
      [
        "owner/project:README.md",
        { text: "# Start\nRun `npm run dev`", version: "readme-1" },
      ],
      [
        "owner/project:docs/setup.md",
        { text: "# Setup\nUse port 3000", version: "docs-1" },
      ],
    ]);
    const { app, store, sourceSync } = setup(files);
    const cookie = await login(app);
    const response = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie },
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      sourceDiscovery: { status: "queued", registered: 2 },
    });
    await sourceSync.refreshDue();
    const sources = store.listSources("owner/project");
    expect(sources.map((source) => source.kind)).toEqual(["readme", "docs"]);
    expect(
      sources.every(
        (source) => store.getSourceSnapshot(source.id)?.status === "fresh",
      ),
    ).toBe(true);
    for (
      let attempt = 0;
      attempt < 50 &&
      Object.keys(store.getFlightPlan("owner/project")?.sourceHashes ?? {})
        .length < 2;
      attempt += 1
    )
      await Bun.sleep(10);
    expect(
      Object.keys(store.getFlightPlan("owner/project")?.sourceHashes ?? {}),
    ).toHaveLength(2);
  });

  test("add fetches immediately, status is scoped, and admin can refresh", async () => {
    const { app, store, github } = setup();
    const cookie = await login(app);
    const connected = await json(
      app,
      "/api/connect",
      { repo: "owner/project" },
      { cookie },
    );
    expect(connected.status).toBe(201);
    const added = await json(
      app,
      "/api/sources",
      { repo: "owner/project", kind: "url", url: "https://example.com/guide" },
      { cookie },
    );
    expect(added.status).toBe(201);
    const source = await added.json();
    expect(source.sync).toMatchObject({
      status: "fresh",
      contentHash: expect.any(String),
      errorCode: null,
    });
    expect(store.getSourceSnapshot(source.id)?.doc?.text).toContain(
      "Run npm run dev",
    );
    const repo = await (
      await app.request("/api/repos/owner/project", { headers: { cookie } })
    ).json();
    expect(repo.sources[0].sync.status).toBe("fresh");
    expect((await app.request(`/api/sources/${source.id}/status`)).status).toBe(
      401,
    );
    expect(
      (
        await app.request(`/api/sources/${source.id}/refresh`, {
          method: "POST",
        })
      ).status,
    ).toBe(401);
    const status = await app.request(`/api/sources/${source.id}/status`, {
      headers: { cookie },
    });
    expect(await status.json()).toMatchObject({
      status: "fresh",
      errorCode: null,
    });
    const refreshed = await app.request(`/api/sources/${source.id}/refresh`, {
      method: "POST",
      headers: { cookie },
    });
    expect(await refreshed.json()).toMatchObject({
      status: "fresh",
      errorCode: null,
    });
    github.permission = {
      visibility: "private",
      canRead: false,
      canAdmin: false,
    };
    const deniedCookie = await login(app);
    expect(
      (
        await app.request(`/api/sources/${source.id}/status`, {
          headers: { cookie: deniedCookie },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await app.request(`/api/sources/${source.id}/refresh`, {
          method: "POST",
          headers: { cookie: deniedCookie },
        })
      ).status,
    ).toBe(403);
  });

  test("rejects mismatched repository file and internal source URL", async () => {
    const { app } = setup();
    const cookie = await login(app);
    await json(app, "/api/connect", { repo: "owner/project" }, { cookie });
    const wrongRepo = await json(
      app,
      "/api/sources",
      {
        repo: "owner/project",
        kind: "readme",
        url: "https://github.com/other/project/blob/main/README.md",
      },
      { cookie },
    );
    expect(wrongRepo.status).toBe(400);
    const internal = await json(
      app,
      "/api/sources",
      { repo: "owner/project", kind: "url", url: "https://127.0.0.1/private" },
      { cookie },
    );
    expect(internal.status).toBe(400);
  });
});
