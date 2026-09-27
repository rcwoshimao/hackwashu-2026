import { expect, test } from "bun:test";
import { login, setup } from "./fixture.ts";

test("connected docs and wiki pages match branch URLs while private access stays scoped", async () => {
  const { app, store } = setup();
  store.putRepo({
    repo: "owner/project",
    visibility: "private",
    connected: true,
    tokenHash: null,
    label: "Drifting",
    driftDegrees: 45,
    latestRunId: "run_docs",
  });
  store.putSource({
    id: "docs",
    repo: "owner/project",
    kind: "docs",
    title: "Quick Start",
    url: "https://github.com/owner/project/blob/abcdef0/docs/Quick%20Start.md",
    claimCount: 1,
  });
  store.putSource({
    id: "wiki",
    repo: "owner/project",
    kind: "wiki",
    title: "Getting Started",
    url: "https://github.com/owner/project/wiki/Getting-Started",
    claimCount: 1,
  });
  store.putRun({
    id: "run_docs",
    repo: "owner/project",
    commitSha: "abcdef0",
    createdAt: "2026-09-26T12:00:00Z",
    verdict: "failure",
    evidence: [],
    results: [
      {
        claimId: "c_1234567890",
        sourceId: "docs",
        quote: "Use port 3000",
        kind: "port_listens",
        params: { port: 3000, startScript: "dev" },
        state: "confirmed",
        status: "pass",
        expected: "port 3000",
        actual: "listening",
        deepLink: null,
      },
      {
        claimId: "c_0987654321",
        sourceId: "wiki",
        quote: "Use port 3000",
        kind: "port_listens",
        params: { port: 3000, startScript: "dev" },
        state: "confirmed",
        status: "fail",
        expected: "port 3000",
        actual: "closed",
        deepLink: null,
      },
    ],
  });
  const docsUrl =
    "https://github.com/owner/project/blob/main/docs/Quick%20Start.md";
  const ask = (url: string, cookie?: string) =>
    app.request(
      `/api/page-claims?url=${encodeURIComponent(url)}`,
      cookie ? { headers: { cookie } } : undefined,
    );
  expect(await (await ask(docsUrl)).json()).toEqual({
    known: false,
    canCheck: false,
    claims: [],
  });
  const cookie = await login(app);
  const docs = await (await ask(docsUrl, cookie)).json();
  expect(docs.claims.map((claim: { id: string }) => claim.id)).toEqual([
    "c_1234567890",
  ]);
  const wiki = await (
    await ask("https://github.com/owner/project/wiki/Getting%20Started", cookie)
  ).json();
  expect(wiki.claims.map((claim: { id: string }) => claim.id)).toEqual([
    "c_0987654321",
  ]);
  expect(
    await (
      await ask(
        "https://github.com/owner/project/blob/main/docs/Other.md",
        cookie,
      )
    ).json(),
  ).toEqual({ known: false, canCheck: false, claims: [] });
});
