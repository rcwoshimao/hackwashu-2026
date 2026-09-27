import { strict as assert } from "node:assert";
import { test } from "node:test";
import { api } from "./api.ts";

const sync = {
  status: "fresh",
  contentHash: "sha256:abc",
  version: "v2",
  fetchedAt: "2026-09-26T00:00:00Z",
  errorCode: null,
};

function fakeResponse(path: string, body?: string): Response {
  if (path === "/api/connect")
    if (body === JSON.stringify({ repo: "owner/public", runtime: true }))
      return Response.json({
        repo: "owner/public",
        visibility: "public",
        runtimeEnabled: true,
        telemetryToken: "public-runtime-telemetry-token",
      });
  if (path === "/api/connect")
    return body === JSON.stringify({ repo: "owner/public" })
      ? Response.json({
          repo: "owner/public",
          visibility: "public",
          runtimeEnabled: false,
        })
      : Response.json({
          repo: "owner/repo",
          visibility: "private",
          runtimeEnabled: true,
          telemetryToken: "token-to-save-in-actions-secret",
        });
  if (path === "/api/sources")
    return Response.json({
      id: "src_1",
      kind: "url",
      title: "Docs",
      url: "https://docs.example.com/start",
      claimCount: 0,
      sync,
    });
  if (path === "/api/sources/src_1/status") return Response.json(sync);
  if (path === "/api/sources/src_1/refresh")
    return Response.json({
      ...sync,
      status: "error",
      errorCode: "fetch_failed",
    });
  if (path === "/api/imessage/link") return Response.json({ status: "sent" });
  return Response.json({ error: "unexpected_path" }, { status: 404 });
}

test("web actions send an iMessage phone and accept the sent status", async () => {
  const original = globalThis.fetch;
  const requests: Array<{ path: string; method: string }> = [];
  globalThis.fetch = Object.assign(
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const path = typeof input === "string" ? input : input.toString();
      requests.push({ path, method: init?.method ?? "GET" });
      assert.equal(init?.credentials, "include");
      if (path === "/api/imessage/link")
        assert.equal(init?.body, JSON.stringify({ phone: "+15551234567" }));
      return fakeResponse(
        path,
        typeof init?.body === "string" ? init.body : undefined,
      );
    },
    { preconnect: async () => {} },
  );
  try {
    const connected = await api.connect("owner/repo");
    assert.equal(
      connected.ok && connected.value.visibility === "private"
        ? connected.value.telemetryToken
        : null,
      "token-to-save-in-actions-secret",
    );
    const publicConnection = await api.connect("owner/public");
    assert.equal(publicConnection.ok, true);
    if (publicConnection.ok) {
      assert.equal(publicConnection.value.visibility, "public");
      assert.equal("telemetryToken" in publicConnection.value, false);
    }
    const runtimeConnection = await api.connect("owner/public", true);
    assert.equal(
      runtimeConnection.ok && runtimeConnection.value.telemetryToken,
      "public-runtime-telemetry-token",
    );
    const created = await api.source(
      "owner/repo",
      "url",
      "https://docs.example.com/start",
    );
    assert.equal(created.ok && created.value.sync?.status, "fresh");
    const status = await api.sourceStatus("src_1");
    assert.equal(status.ok && status.value.version, "v2");
    const refreshed = await api.refreshSource("src_1");
    assert.equal(refreshed.ok && refreshed.value.status, "error");
    const link = await api.imessageLink("+15551234567");
    assert.equal(link.ok && link.value.status, "sent");
    assert.deepEqual(requests, [
      { path: "/api/connect", method: "POST" },
      { path: "/api/connect", method: "POST" },
      { path: "/api/connect", method: "POST" },
      { path: "/api/sources", method: "POST" },
      { path: "/api/sources/src_1/status", method: "GET" },
      { path: "/api/sources/src_1/refresh", method: "POST" },
      { path: "/api/imessage/link", method: "POST" },
    ]);
  } finally {
    globalThis.fetch = original;
  }
});
