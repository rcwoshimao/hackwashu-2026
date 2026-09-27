# Hussein: engine and GitHub integration handoff

This is the merge contract for Hussein's engine work and the web/Sky and iMessage work. The later product decision wins over the pasted planning note: **no public repository code is installed or executed**, including connected public repos. A repo owner can explicitly run checks in a private checkout or in that private repo's CI. The Sky and public “Check this README” use static inspection and optional AI extraction only.

## Ownership and entry points

| Owner | Files and responsibility | Integration point |
| --- | --- | --- |
| Hussein | `packages/claims`, `packages/ai`, `packages/plan`, `packages/runner`, `apps/cli`, `action/`, `demo/orbit-app/.github/workflows/ground-control.yml` | Produces a grounded flight plan, deterministic checks, and Action telemetry. |
| iMessage teammate | `packages/messaging`, `apps/api/src/messaging.ts`, Photon configuration | Receives a stored, confirmed `RunRecord` through `MessagingHub.alert`; uses repo/commit/author and grouped evidence. |
| Web/Sky teammate | `apps/web`, `apps/extension`, `packages/scanner` | Reads `/api/repos`, `/api/runs`, `/api/sky`, `/api/page-claims`, and `/api/events`. Public scan never calls the runtime runner. |
| Shared server boundary | `apps/api/src/telemetry.ts`, `routes-write.ts`, `routes-read.ts` | Validates and stores telemetry, applies trust, posts PR evidence/status, routes a drift alert. Coordinate API changes before merging. |

## Engine sequence

1. Convert README and configured sources to `DocText` with exact quotes and source locations. `extractFlightPlan` in `packages/ai` validates model proposals, grounds them in source text, deduplicates repeated facts, and emits a `FlightPlan`.
2. `planToTests` is the only test-file generator. The plan and `flightchecks/runner.mjs` are reviewed and committed in the private target repo. Model output is data, never executable test code.
3. The nine permitted check kinds are `file_exists`, `script_exists`, `code_reference`, `env_var`, `version`, `cli_flag`, `command_succeeds`, `port_listens`, and `http_example`. Runtime commands require exact README code-block or `package.json` script provenance and the runner's command allowlist.
4. A first passing run confirms a claim. A first failure disputes it without failing the verdict or alerting anyone. A later failure of a previously confirmed claim is drift. The server groups repeated claims of the same fact for a single alert and PR comment.
5. The public scanner uses `runClaims` on fetched README/package metadata and leaves runtime kinds `unverified`. It does not clone or start public repository code.

The current nine-kind schema cannot assert an arbitrary default value or prove that a named symbol is exported rather than merely declared. Do not mark either claim verified from a partial check; use an `unverified` result until a reviewed schema/runner change is agreed in an ADR. `ClaudeModel` and `GeminiModel` are model adapters; neither model may add check kinds or run its proposed commands. Gemini remains the default AI adapter. Setting `EXTRACTION_MODEL=claude` and `ANTHROPIC_API_KEY` opts connected-source and local seed/scan extraction into Claude Sonnet 5; the public Sky remains on Gemini or keyless static inspection.

## Local entry points

`scanLocalCheckout(checkout, privateExecution)` initializes a plan from local docs and runs it; `rerunSavedChecks(checkout, privateExecution)` reruns the saved plan. The thin local commands are `bun run gc scan --private [checkout]` and `bun run gc check --private [checkout]`. They work in an owner-selected directory without `.git`, using a stable synthetic `local/<slug>-<hash>` identity. The `--private` flag is an explicit owner attestation, not a GitHub privacy lookup. Never call either from the public Sky or a visited-repo path. A failed claim gives a nonzero exit code and structured status-only output. The package is local to this workspace; `npx ground-control` is not published yet.

## CI to server to teammates

The sample private-repo workflow has two jobs. `flight-checks` checks `github.event.repository.private` before checkout or dependency installation, runs the Action without the telemetry secret, and uploads `.groundcontrol/telemetry.json`. `report` downloads only that artifact and sends it to `POST /api/telemetry` with the scoped repo token. The Action also rejects missing/public visibility before importing the checkout runner. For pull requests, report mode verifies the repository, head commit, and PR number against the trusted GitHub event. The sample report job skips fork PRs even if a repository has configured GitHub to expose secrets to fork workflows. A same-repo private PR with a missing server URL or token fails visibly instead of showing a misleading green report job.

`POST /api/telemetry` accepts only a connected private repo with its one-time token. With `GITHUB_WRITE_TOKEN`, the server stores the run, posts a `Ground Control` commit status, and posts or updates a PR evidence comment for confirmed drift. The same token lets the server resolve `author.login` from the reported commit before addressing an iMessage; a PR opener or telemetry-supplied `authorLogin` is never trusted as the commit author. A missing server token, missing/unlinked author, or failed lookup leaves the stored run intact and sends no potentially misaddressed alert. Status and PR comments also require the server token.

The raw Action/server contract is `telemetrySchema` in `apps/api/src/telemetry.ts`:

| Field | Meaning |
| --- | --- |
| `repo`, `commitSha` | Exact connected private `owner/repo` and checked-out commit. |
| `pullRequestNumber?`, `authorLogin?`, `codeChanged?`, `docsChanged?`, `changedFiles?` | Change context. `authorLogin` is retained for Action compatibility and is never an iMessage routing authority; the server verifies the commit author separately. |
| `results[]` | Each item has `claimId`, `sourceId`, exact `quote`, one permitted `kind` and its typed `params`, `status`, `expected`, `actual`, and optional `deepLink`. |

`deepLink` identifies the source file and line for GitHub citations; `quote` is the claim text; `expected` and `actual` are the check evidence. Suggested fixes are generated later by the correction flow and are not asserted as part of raw telemetry. The web uses the stored `RunRecord` and evidence groups from `GET /api/runs/:id`. The iMessage teammate should rely on confirmed evidence and the server-resolved author, not parse an Action log or send directly from CI.

## Fake integration data

The checked-in [baseline](../fixtures/integration/hussein-baseline.json) and [drift](../fixtures/integration/hussein-drift.json) are **synthetic private CI telemetry**, not measured GitHub results. They use real IDs, quotes, kinds, and parameters from the bundled Orbit flight plan. The baseline confirms three claims. The next commit changes the server to port 8080 while two README lines still say 3000; both failures group into one `port_listens` fact and one failed run. `apps/api/test/hussein-contract.test.ts` validates both files against `telemetrySchema`, the Orbit plan, and the actual trust/evidence logic. Teammates can use these files as fixtures without waiting for keys or Hussein's branch.

The fake files can be imported directly in unit tests. Sending them to the live API requires connecting a private repo with that exact name and obtaining its scoped token; they are not a bypass for authentication. Use a separate disposable database for an integration rehearsal so synthetic runs do not appear in the real Sky.

## Merge order and checks

1. Agree on the existing `FlightPlan`, `telemetrySchema`, and the two fake payloads before changing any consumer. Do not add a tenth check kind or rename result fields in one teammate's branch alone.
2. Merge engine and CLI changes first, then the Action bundle/workflow, then server/messaging and web changes. Rebuild `action/dist/index.js` whenever `action/src` changes; GitHub loads the bundle, not TypeScript source.
3. Keep private execution and public scanning separate in tests. Run `bun run check`, then `docker compose up --build -d`, check `/healthz`, and run `docker compose exec -T groundcontrol bun ops fly` against the bundled fixture.
4. On a live private demo repo, commit reviewed `flightchecks/` files before enabling the sample workflow. Supply `GROUND_CONTROL_URL` and `GROUND_CONTROL_TOKEN` only to its report job, verify one PR run and one grouped evidence comment, then link the actual commit author to iMessage. Public repo scans should show runtime claims as `unverified`.

Local Docker, schemas, fakes, and the bundled Orbit rehearsal work without GitHub, AI, or Photon keys. A real top-500 scan, live private PR comment, and iMessage delivery require the teammate-owned credentials and an HTTPS origin reachable from GitHub Actions.
