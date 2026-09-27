import { expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { reportTelemetry } from "../src/report.ts";

const identity = {
  repo: "team/orbit-app",
  commitSha: "a".repeat(40),
};

function telemetryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-report-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Report fixture escaped temp directory");
  mkdirSync(join(root, ".groundcontrol"));
  writeFileSync(
    join(root, ".groundcontrol/telemetry.json"),
    JSON.stringify({
      ...identity,
      results: [],
    }),
  );
  return root;
}

test("report mode sends only the JSON artifact with scoped bearer token", async () => {
  const root = telemetryRoot();
  const requests: Array<{
    url: string;
    token: string | null;
    body: string | undefined;
  }> = [];
  try {
    const transport: typeof fetch = async (input, init) => {
      requests.push({
        url: String(input),
        token: new Headers(init?.headers).get("authorization"),
        body: init?.body?.toString(),
      });
      return new Response(null, { status: 202 });
    };
    expect(
      await reportTelemetry(
        root,
        "https://groundcontrol.example",
        "repo-token",
        identity,
        transport,
      ),
    ).toEqual({ ok: true, kind: "sent" });
    expect(requests).toEqual([
      {
        url: "https://groundcontrol.example/api/telemetry",
        token: "Bearer repo-token",
        body: JSON.stringify({
          ...identity,
          results: [],
        }),
      },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the local reporter skips absent configuration and rejects an unsafe server URL", async () => {
  const root = telemetryRoot();
  try {
    expect(
      await reportTelemetry(root, "https://groundcontrol.example", "", null),
    ).toEqual({
      ok: true,
      kind: "skipped",
    });
    expect(
      await reportTelemetry(root, "http://outside.example", "token", identity),
    ).toEqual({ ok: false, error: "invalid_server" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("report mode retries a server error once and keeps a client error final", async () => {
  const root = telemetryRoot();
  let calls = 0;
  try {
    const retrying: typeof fetch = async () => {
      calls += 1;
      return new Response(null, { status: calls === 1 ? 503 : 202 });
    };
    expect(
      await reportTelemetry(
        root,
        "https://groundcontrol.example",
        "token",
        identity,
        retrying,
      ),
    ).toEqual({ ok: true, kind: "sent" });
    expect(calls).toBe(2);
    const denied: typeof fetch = async () =>
      new Response(null, { status: 401 });
    expect(
      await reportTelemetry(
        root,
        "https://groundcontrol.example",
        "token",
        identity,
        denied,
      ),
    ).toEqual({ ok: false, error: "server_rejected", status: 401 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("report mode rejects a mismatched artifact identity before sending", async () => {
  const root = telemetryRoot();
  const calls: string[] = [];
  const transport: typeof fetch = async (input) => {
    calls.push(String(input));
    return new Response(null, { status: 202 });
  };
  try {
    const trusted = {
      repo: "team/orbit-app",
      commitSha: "a".repeat(40),
    };
    for (const override of [
      { repo: "attacker/orbit-app" },
      { commitSha: "b".repeat(40) },
      { pullRequestNumber: 7 },
    ]) {
      writeFileSync(
        join(root, ".groundcontrol/telemetry.json"),
        JSON.stringify({ ...trusted, ...override, results: [] }),
      );
      expect(
        await reportTelemetry(
          root,
          "https://groundcontrol.example",
          "repo-token",
          trusted,
          transport,
        ),
      ).toEqual({ ok: false, error: "identity_mismatch" });
    }
    expect(calls).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("report mode sends a PR artifact only with the matching trusted PR number", async () => {
  const root = telemetryRoot();
  const trusted = { ...identity, pullRequestNumber: 7 };
  let calls = 0;
  try {
    writeFileSync(
      join(root, ".groundcontrol/telemetry.json"),
      JSON.stringify({ ...trusted, results: [] }),
    );
    const transport: typeof fetch = async () => {
      calls += 1;
      return new Response(null, { status: 202 });
    };
    expect(
      await reportTelemetry(
        root,
        "https://groundcontrol.example",
        "repo-token",
        trusted,
        transport,
      ),
    ).toEqual({ ok: true, kind: "sent" });
    expect(calls).toBe(1);
    expect(
      await reportTelemetry(
        root,
        "https://groundcontrol.example",
        "repo-token",
        null,
        transport,
      ),
    ).toEqual({ ok: false, error: "invalid_context" });
    expect(calls).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
