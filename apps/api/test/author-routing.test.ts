import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApi } from "../src/index.ts";
import { ingestTelemetry, telemetrySchema } from "../src/telemetry.ts";
import { json, login, setup } from "./fixture.ts";

function fixture(name: string) {
  return telemetrySchema.parse(
    JSON.parse(
      readFileSync(join(process.cwd(), "fixtures/integration", name), "utf8"),
    ),
  );
}

test("private CI drift routes iMessage to the commit author rather than the PR opener", async () => {
  const { store, auth, events } = setup();
  const lookups: string[] = [];
  const alerts: string[] = [];
  const app = createApi({
    store,
    auth,
    events,
    now: () => new Date("2026-09-26T10:05:00Z"),
    publicUrl: "http://localhost:8787",
    commitAuthor: {
      async lookup(repo, sha) {
        lookups.push(`${repo}@${sha}`);
        return { ok: true, login: "actual-committer" };
      },
    },
    messaging: {
      async alert(_run, author) {
        alerts.push(author);
        return { ok: true, value: { sent: false, alertId: null } };
      },
    },
  });
  const cookie = await login(app);
  const connected = await json(
    app,
    "/api/connect",
    { repo: "team/orbit-app" },
    { cookie },
  );
  const token = (await connected.json()).telemetryToken as string;
  ingestTelemetry(store, fixture("hussein-baseline.json"), new Date());
  const drift = { ...fixture("hussein-drift.json"), authorLogin: "pr-opener" };
  const response = await json(app, "/api/telemetry", drift, {
    authorization: `Bearer ${token}`,
  });
  expect(response.status).toBe(201);
  expect(lookups).toEqual([`${drift.repo}@${drift.commitSha}`]);
  expect(alerts).toEqual(["actual-committer"]);
});

test("commit lookup failure records a fault without messaging an untrusted name", async () => {
  const { store, auth, events } = setup();
  const alerts: string[] = [];
  const app = createApi({
    store,
    auth,
    events,
    now: () => new Date("2026-09-26T10:05:00Z"),
    publicUrl: "http://localhost:8787",
    commitAuthor: {
      async lookup() {
        return { ok: false, error: "github_unavailable" };
      },
    },
    messaging: {
      async alert(_run, author) {
        alerts.push(author);
        return { ok: true, value: { sent: false, alertId: null } };
      },
    },
  });
  const cookie = await login(app);
  const connected = await json(
    app,
    "/api/connect",
    { repo: "team/orbit-app" },
    { cookie },
  );
  const token = (await connected.json()).telemetryToken as string;
  ingestTelemetry(store, fixture("hussein-baseline.json"), new Date());
  const response = await json(
    app,
    "/api/telemetry",
    { ...fixture("hussein-drift.json"), authorLogin: "pr-opener" },
    { authorization: `Bearer ${token}` },
  );
  expect(response.status).toBe(201);
  expect(alerts).toEqual([]);
  expect(
    store
      .eventsAfter(0)
      .some((event) => event.kind === "commit_author_lookup_failed"),
  ).toBe(true);
});

test("an unverified telemetry author cannot address an iMessage", async () => {
  const { store, auth, events } = setup();
  const alerts: string[] = [];
  const app = createApi({
    store,
    auth,
    events,
    now: () => new Date("2026-09-26T10:05:00Z"),
    publicUrl: "http://localhost:8787",
    messaging: {
      async alert(_run, author) {
        alerts.push(author);
        return { ok: true, value: { sent: false, alertId: null } };
      },
    },
  });
  const cookie = await login(app);
  const connected = await json(
    app,
    "/api/connect",
    { repo: "team/orbit-app" },
    { cookie },
  );
  const token = (await connected.json()).telemetryToken as string;
  ingestTelemetry(store, fixture("hussein-baseline.json"), new Date());
  const response = await json(
    app,
    "/api/telemetry",
    { ...fixture("hussein-drift.json"), authorLogin: "another-person" },
    { authorization: `Bearer ${token}` },
  );
  expect(response.status).toBe(201);
  expect(alerts).toEqual([]);
  expect(
    store
      .eventsAfter(0)
      .some((event) => event.kind === "commit_author_lookup_unavailable"),
  ).toBe(true);
});
