import assert from "node:assert/strict";
import { test } from "node:test";
import { runPlan } from "./runner.mjs";

const plan = {"claims":[{"id":"c_13d2e74663","kind":"file_exists","occurrences":[{"location":{"endOffset":237,"kind":"file","lineEnd":9,"lineStart":9,"path":"README.md","sourceId":"readme","startOffset":208},"quote":"Copy `.env.example` to `.env`"}],"params":{"path":".env.example"},"sourceId":"readme","tier":"static"},{"id":"c_cac85d18e9","kind":"file_exists","occurrences":[{"location":{"endOffset":312,"kind":"file","lineEnd":9,"lineStart":9,"path":"README.md","sourceId":"readme","startOffset":283},"quote":"The man page is `man/orbit.1`"}],"params":{"path":"man/orbit.1"},"sourceId":"readme","tier":"static"},{"id":"c_0751486fc7","kind":"file_exists","occurrences":[{"location":{"endOffset":206,"kind":"file","lineEnd":7,"lineStart":7,"path":"README.md","sourceId":"readme","startOffset":144},"quote":"The committed `package-lock.json` keeps installs reproducible."}],"params":{"path":"package-lock.json"},"sourceId":"readme","tier":"static"},{"id":"c_a26bdaa04d","kind":"script_exists","occurrences":[{"location":{"endOffset":412,"kind":"file","lineEnd":18,"lineStart":18,"path":"README.md","sourceId":"readme","startOffset":378},"quote":"The `dev` script starts the server"}],"params":{"script":"dev"},"sourceId":"readme","tier":"static"},{"id":"c_51051afdbd","kind":"script_exists","occurrences":[{"location":{"endOffset":462,"kind":"file","lineEnd":18,"lineStart":18,"path":"README.md","sourceId":"readme","startOffset":418},"quote":"the `start` script runs the same entry point"}],"params":{"script":"start"},"sourceId":"readme","tier":"static"},{"id":"c_d416c4c514","kind":"script_exists","occurrences":[{"location":{"endOffset":990,"kind":"file","lineEnd":34,"lineStart":34,"path":"README.md","sourceId":"readme","startOffset":946},"quote":"The `test` script runs Node's built-in tests"}],"params":{"script":"test"},"sourceId":"readme","tier":"static"},{"id":"c_1313e0340c","kind":"code_reference","occurrences":[{"location":{"endOffset":513,"kind":"file","lineEnd":18,"lineStart":18,"path":"README.md","sourceId":"readme","startOffset":464},"quote":"The code exports `createApp` from `src/server.js`"}],"params":{"name":"createApp"},"sourceId":"readme","tier":"static"},{"id":"c_b57b549b5c","kind":"code_reference","occurrences":[{"location":{"endOffset":553,"kind":"file","lineEnd":18,"lineStart":18,"path":"README.md","sourceId":"readme","startOffset":518},"quote":"`listPlanets` from `src/catalog.js`"}],"params":{"name":"listPlanets"},"sourceId":"readme","tier":"static"},{"id":"c_eee3e48260","kind":"env_var","occurrences":[{"location":{"endOffset":654,"kind":"file","lineEnd":24,"lineStart":24,"path":"README.md","sourceId":"readme","startOffset":623},"quote":"`PORT` can override the default"}],"params":{"name":"PORT"},"sourceId":"readme","tier":"static"},{"id":"c_3c2b61a911","kind":"env_var","occurrences":[{"location":{"endOffset":703,"kind":"file","lineEnd":24,"lineStart":24,"path":"README.md","sourceId":"readme","startOffset":660},"quote":"`ORBIT_GREETING` changes the home-page text"}],"params":{"name":"ORBIT_GREETING"},"sourceId":"readme","tier":"static"},{"id":"c_a2893cb25c","kind":"version","occurrences":[{"location":{"endOffset":143,"kind":"file","lineEnd":7,"lineStart":7,"path":"README.md","sourceId":"readme","startOffset":93},"quote":"The project requires Node.js 24 or newer (`>=24`)."}],"params":{"range":">=24"},"sourceId":"readme","tier":"static"},{"id":"c_b9a1380685","kind":"cli_flag","occurrences":[{"location":{"endOffset":1112,"kind":"file","lineEnd":42,"lineStart":42,"path":"README.md","sourceId":"readme","startOffset":1068},"quote":"The `orbit` CLI supports the `--format` flag"}],"params":{"flag":"--format"},"sourceId":"readme","tier":"runtime"},{"id":"c_8a3639df0a","kind":"command_succeeds","occurrences":[{"location":{"endOffset":1046,"kind":"file","lineEnd":37,"lineStart":37,"path":"README.md","sourceId":"readme","startOffset":1038},"quote":"npm test"}],"params":{"command":"npm test","timeoutMs":120000},"sourceId":"readme","tier":"runtime"},{"id":"c_8ce6190173","kind":"port_listens","occurrences":[{"location":{"endOffset":622,"kind":"file","lineEnd":24,"lineStart":24,"path":"README.md","sourceId":"readme","startOffset":579},"quote":"The server listens on port 3000 by default."}],"params":{"port":3000,"startScript":"dev","timeoutMs":5000},"sourceId":"readme","tier":"runtime"},{"id":"c_6eef036f77","kind":"port_listens","occurrences":[{"location":{"endOffset":790,"kind":"file","lineEnd":30,"lineStart":30,"path":"README.md","sourceId":"readme","startOffset":736},"quote":"Open `http://localhost:3000/` after the server starts."}],"params":{"port":3000,"startScript":"dev","timeoutMs":5000},"sourceId":"readme","tier":"runtime"},{"id":"c_29405cdffb","kind":"http_example","occurrences":[{"location":{"endOffset":865,"kind":"file","lineEnd":30,"lineStart":30,"path":"README.md","sourceId":"readme","startOffset":791},"quote":"`GET /api/health` returns status 200 with JSON keys `status` and `version`"}],"params":{"expectedKeys":["status","version"],"expectedStatus":200,"method":"GET","path":"/api/health"},"sourceId":"readme","tier":"runtime"},{"id":"c_864a49bfa1","kind":"http_example","occurrences":[{"location":{"endOffset":925,"kind":"file","lineEnd":30,"lineStart":30,"path":"README.md","sourceId":"readme","startOffset":867},"quote":"`GET /api/planets` returns status 200 with a `planets` key"}],"params":{"expectedKeys":["planets"],"expectedStatus":200,"method":"GET","path":"/api/planets"},"sourceId":"readme","tier":"runtime"}],"repo":"demo/orbit-app","sourceHashes":{"readme":"5715c1072c0c5ed95f9396819c6c3bbac6765c9cd028b203818656ea863e3804"}};
const results = await runPlan(plan);
const byIndex = plan.claims.map((claim) => results[claim.id]);

test("README.md:9  Copy `.env.example` to `.env`", { skip: byIndex[0]?.status === "unverified" || byIndex[0]?.status === "skipped" }, () => {
  const result = byIndex[0];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:9  The man page is `man/orbit.1`", { skip: byIndex[1]?.status === "unverified" || byIndex[1]?.status === "skipped" }, () => {
  const result = byIndex[1];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:7  The committed `package-lock.json` keeps installs reproducible.", { skip: byIndex[2]?.status === "unverified" || byIndex[2]?.status === "skipped" }, () => {
  const result = byIndex[2];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:18  The `dev` script starts the server", { skip: byIndex[3]?.status === "unverified" || byIndex[3]?.status === "skipped" }, () => {
  const result = byIndex[3];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:18  the `start` script runs the same entry point", { skip: byIndex[4]?.status === "unverified" || byIndex[4]?.status === "skipped" }, () => {
  const result = byIndex[4];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:34  The `test` script runs Node's built-in tests", { skip: byIndex[5]?.status === "unverified" || byIndex[5]?.status === "skipped" }, () => {
  const result = byIndex[5];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:18  The code exports `createApp` from `src/server.js`", { skip: byIndex[6]?.status === "unverified" || byIndex[6]?.status === "skipped" }, () => {
  const result = byIndex[6];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:18  `listPlanets` from `src/catalog.js`", { skip: byIndex[7]?.status === "unverified" || byIndex[7]?.status === "skipped" }, () => {
  const result = byIndex[7];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:24  `PORT` can override the default", { skip: byIndex[8]?.status === "unverified" || byIndex[8]?.status === "skipped" }, () => {
  const result = byIndex[8];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:24  `ORBIT_GREETING` changes the home-page text", { skip: byIndex[9]?.status === "unverified" || byIndex[9]?.status === "skipped" }, () => {
  const result = byIndex[9];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:7  The project requires Node.js 24 or newer (`>=24`).", { skip: byIndex[10]?.status === "unverified" || byIndex[10]?.status === "skipped" }, () => {
  const result = byIndex[10];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:42  The `orbit` CLI supports the `--format` flag", { skip: byIndex[11]?.status === "unverified" || byIndex[11]?.status === "skipped" }, () => {
  const result = byIndex[11];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:37  npm test", { skip: byIndex[12]?.status === "unverified" || byIndex[12]?.status === "skipped" }, () => {
  const result = byIndex[12];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:24  The server listens on port 3000 by default.", { skip: byIndex[13]?.status === "unverified" || byIndex[13]?.status === "skipped" }, () => {
  const result = byIndex[13];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:30  Open `http://localhost:3000/` after the server starts.", { skip: byIndex[14]?.status === "unverified" || byIndex[14]?.status === "skipped" }, () => {
  const result = byIndex[14];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:30  `GET /api/health` returns status 200 with JSON keys `status` and `version`", { skip: byIndex[15]?.status === "unverified" || byIndex[15]?.status === "skipped" }, () => {
  const result = byIndex[15];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

test("README.md:30  `GET /api/planets` returns status 200 with a `planets` key", { skip: byIndex[16]?.status === "unverified" || byIndex[16]?.status === "skipped" }, () => {
  const result = byIndex[16];
  assert.ok(result, "Runner returned no result");
  assert.ok(result.status === "pass" || result.status === "flaky", [result.expected, result.actual].join("\n"));
});

