import { describe, expect, test } from "bun:test";
import { matchingSourcePaths } from "../src/code-scan.ts";
import type { RepositorySnapshot, StaticCheck } from "../src/index.ts";
import {
  memorySnapshot,
  runStaticCheck,
  undocumentedEnvironmentVariables,
} from "../src/index.ts";
import { nodeEngine, readManifest, scriptInManifest } from "../src/manifest.ts";
import { fail, ok, snapshotFail } from "../src/result.ts";
import { checkVersion } from "../src/version.ts";

const files = {
  "README.md": "Run npm run dev and set ORBIT_GREETING.",
  "package.json": JSON.stringify({
    scripts: { dev: "node src/server.js" },
    engines: { node: ">=24 <27" },
  }),
  ".env.example": "ORBIT_GREETING=hello",
  "src/server.js": [
    "export function createOrbit() {",
    "  return process.env.ORBIT_GREETING;",
    "}",
    "const fallback = process.env['FALLBACK_NAME'];",
    "const vite = import.meta.env.PUBLIC_NAME;",
  ].join("\n"),
  "src/other.ts": "export { createPlanet };",
  "dist/generated.js": "function hiddenSymbol() {}",
  "node_modules/fake/index.js": "const hiddenSymbol = true;",
  "build/generated.tsx": "export class hiddenSymbol {}",
};

const snapshot = memorySnapshot(files);

function status(
  check: StaticCheck,
  repo: RepositorySnapshot = snapshot,
): string {
  const result = runStaticCheck(check, repo);
  if (!result.ok)
    throw new Error(`Unexpected runner error: ${result.error.code}`);
  return result.value.status;
}

describe("five static checks", () => {
  test("file_exists accepts an in-repo path and fails on a missing path", () => {
    expect(
      status({ kind: "file_exists", params: { path: ".env.example" } }),
    ).toBe("pass");
    expect(
      status({ kind: "file_exists", params: { path: "missing.txt" } }),
    ).toBe("fail");
  });

  test("file_exists rejects traversal and absolute paths before accessing the snapshot", () => {
    const outside = runStaticCheck(
      { kind: "file_exists", params: { path: "../secret" } },
      snapshot,
    );
    const drive = runStaticCheck(
      { kind: "file_exists", params: { path: "C:\\secret" } },
      snapshot,
    );
    expect(outside).toMatchObject({
      ok: false,
      error: { code: "invalid_path" },
    });
    expect(drive).toMatchObject({ ok: false, error: { code: "invalid_path" } });
  });

  test("script_exists checks package.json scripts, including colon names", () => {
    const withColon = memorySnapshot({
      "package.json": JSON.stringify({
        scripts: { "build:prod": "node build.js" },
      }),
    });
    expect(status({ kind: "script_exists", params: { script: "dev" } })).toBe(
      "pass",
    );
    expect(status({ kind: "script_exists", params: { script: "serve" } })).toBe(
      "fail",
    );
    expect(
      status(
        { kind: "script_exists", params: { script: "build:prod" } },
        withColon,
      ),
    ).toBe("pass");
  });

  test("script_exists reports malformed package.json as an expected error", () => {
    const malformed = memorySnapshot({ "package.json": "{" });
    expect(
      runStaticCheck(
        { kind: "script_exists", params: { script: "dev" } },
        malformed,
      ),
    ).toMatchObject({ ok: false, error: { code: "invalid_manifest" } });
  });

  test("code_reference finds declarations and exports only in tracked source files", () => {
    expect(
      status({ kind: "code_reference", params: { name: "createOrbit" } }),
    ).toBe("pass");
    expect(
      status({ kind: "code_reference", params: { name: "createPlanet" } }),
    ).toBe("pass");
    expect(
      status({ kind: "code_reference", params: { name: "hiddenSymbol" } }),
    ).toBe("fail");
    const untracked = memorySnapshot(
      { "src/secret.js": "export function hiddenSymbol() {}" },
      [],
    );
    expect(
      status(
        { kind: "code_reference", params: { name: "hiddenSymbol" } },
        untracked,
      ),
    ).toBe("fail");
  });

  test("code_reference ignores comments and string literals", () => {
    const decoy = memorySnapshot({
      "src/index.ts":
        "// function phantom() {}\nconst text = 'class phantom {}';\nconst pattern = /function phantom/;",
    });
    expect(
      status({ kind: "code_reference", params: { name: "phantom" } }, decoy),
    ).toBe("fail");
  });

  test("env_var detects the three supported syntax forms", () => {
    for (const name of ["ORBIT_GREETING", "FALLBACK_NAME", "PUBLIC_NAME"]) {
      expect(status({ kind: "env_var", params: { name } })).toBe("pass");
    }
    expect(status({ kind: "env_var", params: { name: "MISSING" } })).toBe(
      "fail",
    );
  });

  test("env_var ignores comments and unrelated strings", () => {
    const decoy = memorySnapshot({
      "src/index.ts":
        "// process.env.GHOST\nconst x = ['process.env.GHOST'];\nconst pattern = /process.env.GHOST/;\nprocess.env.GHOST = 'set';",
    });
    expect(status({ kind: "env_var", params: { name: "GHOST" } }, decoy)).toBe(
      "fail",
    );
    expect(undocumentedEnvironmentVariables(decoy, new Set())).toEqual({
      ok: true,
      value: [],
    });
  });

  test("version checks overlap with all project Node constraints", () => {
    expect(status({ kind: "version", params: { range: ">=24 <26" } })).toBe(
      "pass",
    );
    expect(status({ kind: "version", params: { range: "<20" } })).toBe("fail");
    const pinned = memorySnapshot({ ...files, ".nvmrc": "v26\n" });
    expect(status({ kind: "version", params: { range: "24.x" } }, pinned)).toBe(
      "fail",
    );
    expect(status({ kind: "version", params: { range: "26.x" } }, pinned)).toBe(
      "pass",
    );
  });

  test("version is unverified when the repo declares no Node requirement", () => {
    expect(
      status(
        { kind: "version", params: { range: ">=24" } },
        memorySnapshot({}),
      ),
    ).toBe("unverified");
  });

  test("version rejects invalid ranges and respects .node-version", () => {
    const pinned = memorySnapshot({ ".node-version": "24.1.0\n" });
    expect(
      status({ kind: "version", params: { range: "^24.0.0" } }, pinned),
    ).toBe("pass");
    expect(checkVersion(pinned, "not a version")).toMatchObject({
      ok: false,
      error: { code: "invalid_range" },
    });
  });
});

describe("snapshot helpers and env inventory", () => {
  test("memorySnapshot provides independent file and tracked-path views", () => {
    const repo = memorySnapshot({ "README.md": "text", "src/a.js": "code" }, [
      "src/a.js",
    ]);
    expect(repo.pathExists("README.md")).toEqual({ ok: true, value: true });
    expect(repo.readText("missing")).toEqual({ ok: true, value: null });
    expect(repo.trackedPaths()).toEqual({ ok: true, value: ["src/a.js"] });
  });

  test("matchingSourcePaths returns only tracked source hits", () => {
    expect(
      matchingSourcePaths(snapshot, "createOrbit", "code_reference"),
    ).toEqual({ ok: true, value: ["src/server.js"] });
  });

  test("undocumented env vars are separate findings, not failed claims", () => {
    const found = undocumentedEnvironmentVariables(
      snapshot,
      new Set(["ORBIT_GREETING"]),
    );
    expect(found).toEqual({
      ok: true,
      value: [
        { name: "FALLBACK_NAME", paths: ["src/server.js"] },
        { name: "PUBLIC_NAME", paths: ["src/server.js"] },
      ],
    });
  });

  test("readManifest and manifest selectors handle absent and present data", () => {
    const present = readManifest(snapshot);
    expect(present.ok).toBe(true);
    if (!present.ok) return;
    expect(scriptInManifest(present.value, "dev")).toBe(true);
    expect(nodeEngine(present.value)).toBe(">=24 <27");
    expect(readManifest(memorySnapshot({}))).toEqual({ ok: true, value: null });
    expect(scriptInManifest(null, "dev")).toBe(false);
    expect(nodeEngine(null)).toBeNull();
  });

  test("Result helpers preserve typed success and failure", () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(fail("invalid_path", "../x")).toEqual({
      ok: false,
      error: { code: "invalid_path", subject: "../x" },
    });
    expect(snapshotFail({ code: "io_error", path: "x" })).toEqual({
      ok: false,
      error: {
        code: "snapshot_error",
        snapshot: { code: "io_error", path: "x" },
      },
    });
  });
});
