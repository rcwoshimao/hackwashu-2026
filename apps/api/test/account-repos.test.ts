import { expect, test } from "bun:test";
import { json, login, setup } from "./fixture.ts";

test("signed-in inventory lists accessible repos without connecting or scanning", async () => {
  const { app, github, store, scans } = setup();
  github.accountRepos = {
    repos: [
      {
        repo: "owner/private",
        visibility: "private",
        canAdmin: true,
        description: "Private project",
        language: "TypeScript",
        updatedAt: "2026-09-26T10:00:00Z",
        archived: false,
        fork: false,
      },
      {
        repo: "owner/public",
        visibility: "public",
        canAdmin: true,
        description: null,
        language: "JavaScript",
        updatedAt: null,
        archived: false,
        fork: false,
      },
    ],
    truncated: false,
  };
  expect((await app.request("/api/account/repos")).status).toBe(401);
  const cookie = await login(app);
  const listed = await app.request("/api/account/repos", {
    headers: { cookie },
  });
  expect(listed.status).toBe(200);
  expect(listed.headers.get("cache-control")).toBe("private, no-store");
  const body = await listed.json();
  expect(body.repos.map((item: { repo: string }) => item.repo)).toEqual([
    "owner/private",
    "owner/public",
  ]);
  expect(
    body.repos.every((item: { connected: boolean }) => !item.connected),
  ).toBe(true);
  expect(JSON.stringify(body)).not.toContain("github-oauth-token");
  expect(store.listRepos()).toEqual([]);
  expect(scans).toEqual([]);
  const connected = await json(
    app,
    "/api/connect",
    { repo: "owner/private" },
    { cookie },
  );
  expect(connected.status).toBe(201);
  const again = await app.request("/api/account/repos", {
    headers: { cookie },
  });
  expect((await again.json()).repos[0].connected).toBe(true);
  expect(
    (
      await (
        await app.request("/api/account/repos", { headers: { cookie } })
      ).json()
    ).repos[0].runtimeEnabled,
  ).toBe(true);
  store.putRun({
    id: "run_private_1",
    repo: "owner/private",
    commitSha: "abcdef0",
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "success",
    results: [],
    evidence: [],
  });
  const privateRepo = store.getRepo("owner/private");
  expect(privateRepo).not.toBeNull();
  if (privateRepo)
    store.putRepo({
      ...privateRepo,
      latestRunId: "run_private_1",
      label: "On course",
    });
  const checked = await app.request("/api/account/repos", {
    headers: { cookie },
  });
  expect((await checked.json()).repos[0]).toMatchObject({
    checked: true,
    label: "On course",
    scanned: false,
  });
});
