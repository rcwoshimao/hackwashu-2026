import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  claimId,
  claimSchema,
  flightPlanSchema,
  planToTests,
} from "../packages/plan/src/index.ts";

const root = join(process.cwd(), "demo/orbit-app");
const readme = readFileSync(join(root, "README.md"), "utf8");
const claims = [
  [
    "file_exists",
    { path: ".env.example" },
    "Copy `.env.example` to `.env`",
    "static",
  ],
  [
    "file_exists",
    { path: "man/orbit.1" },
    "The man page is `man/orbit.1`",
    "static",
  ],
  [
    "file_exists",
    { path: "package-lock.json" },
    "The committed `package-lock.json` keeps installs reproducible.",
    "static",
  ],
  [
    "script_exists",
    { script: "dev" },
    "The `dev` script starts the server",
    "static",
  ],
  [
    "script_exists",
    { script: "start" },
    "the `start` script runs the same entry point",
    "static",
  ],
  [
    "script_exists",
    { script: "test" },
    "The `test` script runs Node's built-in tests",
    "static",
  ],
  [
    "code_reference",
    { name: "createApp" },
    "The code exports `createApp` from `src/server.js`",
    "static",
  ],
  [
    "code_reference",
    { name: "listPlanets" },
    "`listPlanets` from `src/catalog.js`",
    "static",
  ],
  ["env_var", { name: "PORT" }, "`PORT` can override the default", "static"],
  [
    "env_var",
    { name: "ORBIT_GREETING" },
    "`ORBIT_GREETING` changes the home-page text",
    "static",
  ],
  [
    "version",
    { range: ">=24" },
    "The project requires Node.js 24 or newer (`>=24`).",
    "static",
  ],
  [
    "cli_flag",
    { flag: "--format" },
    "The `orbit` CLI supports the `--format` flag",
    "runtime",
  ],
  [
    "command_succeeds",
    { command: "npm test", timeoutMs: 120000 },
    "npm test",
    "runtime",
  ],
  [
    "port_listens",
    { port: 3000, startScript: "dev", timeoutMs: 5000 },
    "The server listens on port 3000 by default.",
    "runtime",
  ],
  [
    "port_listens",
    { port: 3000, startScript: "dev", timeoutMs: 5000 },
    "Open `http://localhost:3000/` after the server starts.",
    "runtime",
  ],
  [
    "http_example",
    {
      method: "GET",
      path: "/api/health",
      expectedStatus: 200,
      expectedKeys: ["status", "version"],
    },
    "`GET /api/health` returns status 200 with JSON keys `status` and `version`",
    "runtime",
  ],
  [
    "http_example",
    {
      method: "GET",
      path: "/api/planets",
      expectedStatus: 200,
      expectedKeys: ["planets"],
    },
    "`GET /api/planets` returns status 200 with a `planets` key",
    "runtime",
  ],
] as const;

const mapped = claims.map(([kind, params, quote, tier]) => {
  const startOffset = readme.indexOf(quote);
  if (startOffset < 0) throw new Error(`Quote missing: ${quote}`);
  const endOffset = startOffset + quote.length;
  const lineStart = readme.slice(0, startOffset).split("\n").length;
  const lineEnd = readme.slice(0, endOffset).split("\n").length;
  return claimSchema.parse({
    id: claimId("readme", quote, kind, params),
    sourceId: "readme",
    kind,
    params,
    tier,
    occurrences: [
      {
        quote,
        location: {
          kind: "file",
          sourceId: "readme",
          path: "README.md",
          lineStart,
          lineEnd,
          startOffset,
          endOffset,
        },
      },
    ],
  });
});

const plan = flightPlanSchema.parse({
  repo: "demo/orbit-app",
  sourceHashes: { readme: createHash("sha256").update(readme).digest("hex") },
  claims: mapped,
});
const target = join(root, "flightchecks");
mkdirSync(target, { recursive: true });
writeFileSync(
  join(target, "flightplan.json"),
  `${JSON.stringify(plan, null, 2)}\n`,
);
writeFileSync(join(target, "flight.test.mjs"), planToTests(plan));
