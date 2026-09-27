import { expect, test } from "bun:test";
import { createApi } from "../src/index.ts";
import { json, login, setup } from "./fixture.ts";

test("docs changed on a push queues connected source refresh without delaying telemetry", async () => {
  const { store, auth, events } = setup();
  const calls: string[] = [];
  const sourceSync = {
    async discover() {
      return { ok: true as const, value: [] };
    },
    status() {
      return {
        ok: true as const,
        value: {
          status: "pending" as const,
          contentHash: null,
          version: null,
          fetchedAt: null,
          errorCode: null,
        },
      };
    },
    refresh(sourceId: string) {
      calls.push(sourceId);
      return new Promise<never>(() => {});
    },
  };
  const app = createApi({
    store,
    auth,
    events,
    sourceSync,
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
  for (const id of ["readme", "docs"])
    store.putSource({
      id,
      repo: "owner/project",
      kind: id === "readme" ? "readme" : "docs",
      title: id,
      url: `https://github.com/owner/project/blob/main/${id}.md`,
      claimCount: 0,
    });
  const send = (commitSha: string, pullRequestNumber?: number) =>
    json(
      app,
      "/api/telemetry",
      {
        repo: "owner/project",
        commitSha,
        docsChanged: true,
        ...(pullRequestNumber ? { pullRequestNumber } : {}),
        results: [],
      },
      { authorization: `Bearer ${token}` },
    );
  const push = await send("a".repeat(40));
  expect(push.status).toBe(201);
  await Bun.sleep(0);
  expect(calls).toEqual(["readme", "docs"]);
  expect((await send("b".repeat(40), 7)).status).toBe(201);
  await Bun.sleep(0);
  expect(calls).toEqual(["readme", "docs"]);
});
