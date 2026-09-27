// action/src/git-context.ts
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// action/src/limits.ts
var reportTimeoutMs = 1e4;
var reportRetryDelayMs = 500;
var reportAttempts = 2;
var maxTelemetryBytes = 2000000;
var gitTimeoutMs = 5000;
var gitOutputLimitBytes = 2000000;

// action/src/git-context.ts
function field(value, path) {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = current[key];
  }
  return current;
}
function stringField(value, path) {
  const found = field(value, path);
  return typeof found === "string" && found.length > 0 ? found : null;
}
function privateRunRepository(event, expectedRepo) {
  return typeof expectedRepo === "string" && expectedRepo.length > 0 && field(event, ["repository", "private"]) === true && stringField(event, ["repository", "full_name"]) === expectedRepo;
}
function systemGitDiff(root, args) {
  const result = spawnSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: gitTimeoutMs,
    maxBuffer: gitOutputLimitBytes
  });
  if (result.error || result.status !== 0 || typeof result.stdout !== "string")
    return null;
  return result.stdout.split(/\r?\n/u).filter((path) => path.length > 0);
}
function checkedOutCommit(root, diff = systemGitDiff) {
  const sha = diff(root, ["rev-parse", "HEAD"])?.[0];
  return sha && /^[0-9a-f]{40,64}$/u.test(sha) ? sha : null;
}
function changedPaths(root, event, diff) {
  const base = stringField(event, ["pull_request", "base", "sha"]);
  const head = stringField(event, ["pull_request", "head", "sha"]);
  if (base && head)
    return diff(root, ["diff", "--name-only", base, head]);
  const before = stringField(event, ["before"]);
  const after = stringField(event, ["after"]);
  if (!after)
    return [];
  if (!before || /^0+$/u.test(before))
    return diff(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      after
    ]);
  return diff(root, ["diff", "--name-only", before, after]);
}
function watchedDocs(root) {
  const paths = new Set(["README.md"]);
  try {
    const plan = JSON.parse(readFileSync(join(root, "flightchecks/flightplan.json"), "utf8"));
    const claims = field(plan, ["claims"]);
    if (!Array.isArray(claims))
      return paths;
    for (const claim of claims) {
      const occurrences = field(claim, ["occurrences"]);
      if (!Array.isArray(occurrences))
        continue;
      for (const occurrence of occurrences) {
        if (stringField(occurrence, ["location", "kind"]) !== "file")
          continue;
        const path = stringField(occurrence, ["location", "path"]);
        if (path)
          paths.add(path);
      }
    }
  } catch {
    return paths;
  }
  return paths;
}
function actionMetadata(root, event, diff = systemGitDiff) {
  const changedFiles = changedPaths(root, event, diff);
  const authorLogin = stringField(event, ["head_commit", "author", "username"]) ?? stringField(event, ["pull_request", "user", "login"]) ?? stringField(event, ["pull_request", "head", "user", "login"]) ?? stringField(event, ["sender", "login"]);
  const metadata = {};
  const pullRequestNumber = field(event, ["number"]);
  const pullRequest = field(event, ["pull_request"]);
  if (typeof pullRequest === "object" && pullRequest !== null && typeof pullRequestNumber === "number" && Number.isSafeInteger(pullRequestNumber) && pullRequestNumber > 0)
    metadata.pullRequestNumber = pullRequestNumber;
  if (authorLogin)
    metadata.authorLogin = authorLogin;
  if (changedFiles !== null) {
    const watched = watchedDocs(root);
    metadata.changedFiles = changedFiles;
    metadata.docsChanged = changedFiles.some((path) => watched.has(path) || path.startsWith("docs/") && path.endsWith(".md"));
    metadata.codeChanged = changedFiles.some((path) => !path.endsWith(".md") && !path.startsWith("docs/") && !path.startsWith("flightchecks/"));
  }
  return metadata;
}
function metadataForCheckout(root, event, commitSha, diff = systemGitDiff) {
  const metadata = actionMetadata(root, event, diff);
  if (metadata.pullRequestNumber !== undefined && stringField(event, ["pull_request", "head", "sha"]) !== commitSha) {
    delete metadata.pullRequestNumber;
  }
  return metadata;
}
function readActionEvent(path) {
  if (!path)
    return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

// action/src/report.ts
import { readFileSync as readFileSync2, statSync } from "node:fs";
import { join as join2 } from "node:path";

// action/src/report-context.ts
var repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
var shaPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
function field2(value, path) {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = current[key];
  }
  return current;
}
function validReportIdentity(identity) {
  return identity !== null && repoPattern.test(identity.repo) && shaPattern.test(identity.commitSha) && (identity.pullRequestNumber === undefined || Number.isSafeInteger(identity.pullRequestNumber) && identity.pullRequestNumber > 0 && identity.pullRequestNumber <= 2147483647);
}
function trustedReportIdentity(context) {
  const { repository, workflowSha, eventName, event } = context;
  if (!repository || !workflowSha || !repoPattern.test(repository) || !shaPattern.test(workflowSha))
    return null;
  if (eventName === "pull_request") {
    const head = field2(event, ["pull_request", "head", "sha"]);
    const number = field2(event, ["number"]);
    const eventRepo = field2(event, ["repository", "full_name"]);
    if (typeof head !== "string" || !shaPattern.test(head) || typeof number !== "number" || !Number.isSafeInteger(number) || number < 1 || number > 2147483647 || eventRepo !== repository)
      return null;
    return { repo: repository, commitSha: head, pullRequestNumber: number };
  }
  if (eventName !== "push" && eventName !== "schedule" && eventName !== "workflow_dispatch")
    return null;
  const after = field2(event, ["after"]);
  if (eventName === "push" && after !== null && after !== workflowSha)
    return null;
  return { repo: repository, commitSha: workflowSha };
}

// action/src/report.ts
function readTelemetry(root) {
  try {
    const path = join2(root, ".groundcontrol/telemetry.json");
    if (statSync(path).size > maxTelemetryBytes)
      return null;
    const value = JSON.parse(readFileSync2(path, "utf8"));
    if (typeof value !== "object" || value === null || !("repo" in value) || !("commitSha" in value) || !("results" in value))
      return null;
    if (typeof value.repo !== "string" || typeof value.commitSha !== "string" || !Array.isArray(value.results))
      return null;
    return value;
  } catch {
    return null;
  }
}
function telemetryEndpoint(server) {
  try {
    const base = new URL(server);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && local))
      return null;
    if (base.username || base.password || base.search || base.hash)
      return null;
    return new URL("/api/telemetry", base);
  } catch {
    return null;
  }
}
async function sendOnce(endpoint, token, body, transport) {
  try {
    const response = await transport(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body,
      signal: AbortSignal.timeout(reportTimeoutMs)
    });
    if (response.ok)
      return { ok: true, kind: "sent" };
    return { ok: false, error: "server_rejected", status: response.status };
  } catch {
    return { ok: false, error: "network" };
  }
}
async function reportTelemetry(root, server, token, identity, transport = fetch) {
  if (!server || !token)
    return { ok: true, kind: "skipped" };
  const endpoint = telemetryEndpoint(server);
  if (!endpoint)
    return { ok: false, error: "invalid_server" };
  if (!validReportIdentity(identity))
    return { ok: false, error: "invalid_context" };
  const telemetry = readTelemetry(root);
  if (!telemetry)
    return { ok: false, error: "invalid_telemetry" };
  if (telemetry.repo !== identity.repo || telemetry.commitSha !== identity.commitSha || telemetry.pullRequestNumber !== identity.pullRequestNumber)
    return { ok: false, error: "identity_mismatch" };
  const body = JSON.stringify(telemetry);
  let last = { ok: false, error: "network" };
  for (let attempt = 1;attempt <= reportAttempts; attempt += 1) {
    const result = await sendOnce(endpoint, token, body, transport);
    last = result;
    if (result.ok || result.error === "server_rejected" && (result.status ?? 0) < 500)
      return result;
    if (attempt < reportAttempts)
      await new Promise((resolve) => setTimeout(resolve, reportRetryDelayMs));
  }
  return last;
}

// action/src/run.ts
import { mkdirSync, readFileSync as readFileSync3, writeFileSync } from "node:fs";
import { join as join3 } from "node:path";
import { pathToFileURL } from "node:url";
function readPlan(root) {
  const content = readFileSync3(join3(root, "flightchecks/flightplan.json"), "utf8");
  const plan = JSON.parse(content);
  if (typeof plan !== "object" || plan === null || !("claims" in plan) || !Array.isArray(plan.claims)) {
    throw new TypeError("Flight plan has no claims array");
  }
  return plan;
}
function deepLink(repo, sha, claim) {
  const location = claim.occurrences[0]?.location;
  if (location?.kind !== "file" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo))
    return null;
  const path = location.path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repo}/blob/${sha}/${path}#L${location.lineStart}`;
}
function resultFor(claim, outcome, repo, sha) {
  const quote = claim.occurrences[0]?.quote;
  if (!quote)
    throw new TypeError(`Claim ${claim.id} lacks an occurrence`);
  return {
    kind: claim.kind,
    params: claim.params,
    claimId: claim.id,
    sourceId: claim.sourceId,
    quote,
    status: outcome.status,
    expected: outcome.expected,
    actual: outcome.actual.split(/\r?\n/u).slice(0, 20).join(`
`),
    deepLink: deepLink(repo, sha, claim)
  };
}
async function loadRunner(root) {
  const path = pathToFileURL(join3(root, "flightchecks/runner.mjs")).href;
  const module = await import(path);
  if (typeof module !== "object" || module === null || !("runPlan" in module) || typeof module.runPlan !== "function") {
    throw new TypeError("Bundled runner does not export runPlan");
  }
  return module.runPlan;
}
async function loadPrivateRunner(root, event, repo) {
  if (!privateRunRepository(event, repo))
    return { ok: false, error: { code: "private_repository_required" } };
  return { ok: true, value: await loadRunner(root) };
}
async function runFlightChecks(root, repo, commitSha, runner, metadata = {}) {
  const plan = readPlan(root);
  const results = await runner(plan, root);
  const telemetry = {
    repo,
    commitSha,
    ...metadata,
    results: plan.claims.map((claim) => {
      const outcome = results[claim.id];
      if (!outcome)
        throw new Error(`Runner returned no result for ${claim.id}`);
      return resultFor(claim, outcome, repo, commitSha);
    })
  };
  const output = join3(root, ".groundcontrol");
  mkdirSync(output, { recursive: true });
  writeFileSync(join3(output, "telemetry.json"), `${JSON.stringify(telemetry, null, 2)}
`);
  return telemetry;
}

// action/src/index.ts
async function main() {
  const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const mode = process.env.INPUT_MODE;
  if (mode === "report") {
    const identity = trustedReportIdentity({
      repository: process.env.GITHUB_REPOSITORY,
      workflowSha: process.env.GITHUB_SHA,
      eventName: process.env.GITHUB_EVENT_NAME,
      event: readActionEvent(process.env.GITHUB_EVENT_PATH)
    });
    const result = await reportTelemetry(root, process.env.INPUT_SERVER ?? "", process.env.INPUT_TOKEN ?? "", identity);
    if (!result.ok) {
      process.stderr.write(`Telemetry report failed: ${result.error}${result.status ? ` (${result.status})` : ""}
`);
      process.exitCode = 1;
    }
    return;
  }
  if (mode !== "run")
    throw new TypeError("Action mode must be run or report");
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const event = readActionEvent(process.env.GITHUB_EVENT_PATH);
  const runner = await loadPrivateRunner(root, event, repo);
  if (!runner.ok) {
    process.stderr.write(`${runner.error.code}
`);
    process.exitCode = 1;
    return;
  }
  const sha = checkedOutCommit(root) ?? process.env.GITHUB_SHA;
  if (!sha || !/^[0-9a-f]{40,64}$/u.test(sha))
    throw new TypeError("GitHub repository and checked-out commit are required");
  const metadata = metadataForCheckout(root, event, sha);
  await runFlightChecks(root, repo, sha, runner.value, metadata);
}
await main().catch(() => {
  process.stderr.write(`Ground Control action failed before telemetry could be reported
`);
  process.exitCode = 1;
});
