import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection, createServer } from "node:net";
import { join, sep } from "node:path";
import { runServerChecks } from "../packages/runner/src/server.ts";

const orbitRoot = join(process.cwd(), "demo/orbit-app");

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No TCP port was assigned");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

function writeFixture(directory: string, port: number): void {
  mkdirSync(join(directory, "src"), { recursive: true });
  writeFileSync(
    join(directory, "package.json"),
    readFileSync(join(orbitRoot, "package.json")),
  );
  writeFileSync(
    join(directory, "src/catalog.js"),
    readFileSync(join(orbitRoot, "src/catalog.js")),
  );
  const server = readFileSync(join(orbitRoot, "src/server.js"), "utf8");
  assert.ok(server.includes('process.env.PORT ?? "3000"'));
  writeFileSync(
    join(directory, "src/server.js"),
    server.replace(
      'process.env.PORT ?? "3000"',
      `process.env.PORT ?? "${port}"`,
    ),
  );
}

async function canBind(port: number): Promise<boolean> {
  const server = createServer();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", resolve);
    });
    return true;
  } catch {
    return false;
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function check(): Promise<void> {
  const expectedPort = await freePort();
  let driftedPort = await freePort();
  while (driftedPort === expectedPort) driftedPort = await freePort();
  const directory = mkdtempSync(join(orbitRoot, ".runtime-check-"));
  const parent = realpathSync(orbitRoot);
  const resolved = realpathSync(directory);
  if (!resolved.startsWith(`${parent}${sep}`))
    throw new Error("Fixture path left Orbit root");
  try {
    writeFixture(directory, expectedPort);
    const port = [
      { id: "port", port: expectedPort, startScript: "dev", timeoutMs: 3000 },
    ];
    const http = [
      {
        id: "health",
        method: "GET",
        path: "/api/health",
        expectedStatus: 200,
        expectedKeys: ["status", "version"],
      },
    ];
    const baseline = await runServerChecks(port, http, directory);
    assert.equal(baseline.port?.status, "pass", JSON.stringify(baseline));
    assert.equal(baseline.health?.status, "pass", JSON.stringify(baseline));
    assert.equal(
      await canBind(expectedPort),
      true,
      "Baseline server remained alive",
    );
    assert.equal(
      await canConnect(expectedPort),
      false,
      "Baseline port still accepted connections",
    );
    writeFixture(directory, driftedPort);
    const drift = await runServerChecks(
      [{ ...port[0], timeoutMs: 1500 }],
      [],
      directory,
    );
    assert.equal(drift.port?.status, "fail", JSON.stringify(drift));
    assert.equal(
      await canBind(driftedPort),
      true,
      "Drift server remained alive",
    );
    process.stdout.write(
      `baseline port ${expectedPort}: pass; drift port ${driftedPort}: fail\n`,
    );
  } finally {
    rmSync(directory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}

await check();
