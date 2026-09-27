# Ground Control build plan

This plan follows `docs/CODEX_MASTER_PROMPT.md`, with the user's later instructions to finish the full local product, focus on iMessage instead of Telegram, and never execute public repository code. The latest product decision removes the earlier proposal for a public runtime sandbox. Docker Desktop is the primary local run path; Azure deployment is deferred. All public repositories, including connected ones, remain static and optional AI scan targets. Only an explicitly connected private repository may run runtime checks in its own CI or through an owner-initiated local checkout.

## Current implementation status

- Phases 1–7 are implemented locally: extraction and deterministic checks, the Orbit demo, source sync, API and sign-in, CI telemetry and status, grouped alerts and correction proposals, the web Sky, and the browser extension. The demo plan has 17 claims; a port-only code change breaks the two README port citations and groups them as one fact.
- Phase 8 has a local Docker stack and a Docker-only keyless rehearsal. The quick-version benchmark command and isolated `node:24` executor are implemented, but the measured ten-run report requires a Gemini key. The 500-repository scan requires a GitHub token and optional Gemini key; the three starter satellites remain clearly simulated.
- The local `bun ops fly` command is available on the host or through `docker compose exec -T groundcontrol bun ops fly`. It executes only Ground Control's bundled Orbit fixture when explicitly invoked and never fetches a public GitHub repository. npm publication and Azure hosting are deferred.
- Remaining external verification needs the user's GitHub, Gemini, Photon, and optional Confluence credentials. Unpacked Chrome testing and a measured 500-satellite frame-rate test have not run in this environment. PR branch docs do not yet regenerate a plan from the PR head; default-branch docs changes trigger immediate refresh, and admins can refresh or seed a plan manually.
- The Action report validates artifact repo, SHA, and PR number against GitHub workflow context before sending. Check results still come from the connected repository's CI checkout. Treat its status as advisory for branches whose authors can change the runner until a separate trusted attestation is added.
- Final local gate: `bun run check` passed with 187 tests and five goldens after the public/private execution boundary changes. `docker compose up --build -d` rebuilt and started the current image; Docker reported healthy and `/healthz` returned `ok`. The current image ran `bun ops fly` with 17 baseline passes and two cited port failures after one changed file. An earlier rehearsal also built the extension, exported `/app/data/sky.json`, and passed iMessage messaging tests.
- Messaging migration: replace the Telegram bot deep-link flow with a Spectrum Cloud iMessage outbound verification message. The signed-in user enters an E.164 phone number, receives a one-use `LINK` code, and confirms by replying from that number. Keep the server and simulator usable without Spectrum credentials. Local tests cover the transport and linking rules; a live phone exchange requires the user's project credentials and provisioned iMessage line.
- Connection visibility: `/api/connect` reports `public` or `private`. Only private connections receive a one-time telemetry token and GitHub Actions setup; public connections can continue to their documentation sources and revoke any older telemetry token. A private-to-public visibility change returns 409, keeps historical data private, and invalidates the old telemetry token. Private data read routes and `/api/me` also reject a stored private record when GitHub reports public visibility. Plan publication is scheduled only for connected private repositories, and the GitHub writer rechecks current private visibility before committing generated files. API and web tests cover both connection responses and the visibility transition.

## Phase 1: foundation

- Files: root `package.json`, `tsconfig.json`, `biome.json`, `.env.example`, `ops.ts`, `config/limits.ts`; `packages/copy`, `packages/sources`, `packages/plan`, `packages/claims`, and `packages/runner`; five README fixtures under `fixtures/readmes/`.
- Tests: Zod schema and stable ID tests, 1,000-run ID and quote-location properties, five candidate golden cases, pass/fail and boundary cases for the five static checks, copy lint, TypeScript, and Biome. Gate: `bun run check` and `bun ops candidates <file>` on all five fixtures.
- Verified: `bun run check` passed with 51 tests and five goldens; candidate counts were 11, 7, 9, 12, and 9 across the five fixtures. The Git subprocess success path could not execute in this sandbox; the filesystem snapshot adapter and typed Git error path passed.
- Assumptions: the starter kit copied from `files/ground-control-starter/ground-control-starter/` is the project source; the supplied master prompt governs conflicts. Phase 1 implements `file_exists`, `script_exists`, `code_reference`, `env_var`, and `version`; `cli_flag` joins the other three remaining kinds in Phase 2. A claim's ID excludes location as required, so repeated facts in one source share an ID and retain each exact quote with its own location. `code_reference` scans Git-tracked files when a Git index is available, and fixture-provided files in isolated tests. Generalized schema fields absent from the spec are kept minimal and recorded in an ADR before public types freeze. No project code runs in static checks.

## Phase 2: demo and generated checks

- Files: `demo/orbit-app/` (including man page and 20 drift patches), `demo/orbit-app-wiki/`, `demo/confluence/`, `packages/plan` generator, `packages/runner` runtime implementation and emitted `runner.mjs`, and demo branch tooling in `ops.ts`.
- Tests: byte-identical `planToTests` property; orbit main Node tests; port patch fails exactly the cited port check; process-group cleanup on thrown checks.
- Assumptions: patches stand in for branches until the human publishes the demo repo. Node 24 runs the generated checks.

## Phase 3: sources, extraction, trust, evidence

- Files: `packages/sources` converters and adapters, `packages/ai`, trust and evidence modules, extraction commands, fixture sources, and golden outputs.
- Tests: unchanged sections cause zero model calls; one edited section re-extracts alone; confirmation failure disputes; grouped three-source port evidence; rendered comment, text, and tooltip goldens.
- Assumptions: model calls are cached by prompt version, model, and input hash; source text is sent to Gemini only after connection and disclosure.

## Phase 4: server, CI, sign-in, simulator

- Files: `apps/api`, `packages/auth`, `packages/store`, `action/`, workflow, migrations, polling, `LocalGit`, `docs/API_CONTRACT.md`, and `ops` register/seed/ping/simulate commands.
- Tests: local main confirms claims; patched port opens one grouped drift and failing commit status; signed-out private data is denied; API and polling tests use fakes.
- Assumptions: connected private repo code runs only in its secret-free CI or in an owner-initiated local checkout. A connected public repo can sync documentation but stays on static and optional AI checks; the server owns trust states and verdicts.

## Phase 5: messaging and fixes

- Files: `packages/messaging`, GitHub and Confluence fix adapters, copy deck additions, inbound command parsing, and verified-answer flow.
- Tests: fully local one-change/three-doc end-to-end fixture; one alert, tested pull request, wiki patch, Confluence footer comment, summary, and verified run answer.
- Assumptions: Photon is pinned to the vendored 12.10.1 API; cloud iMessage uses `imessage.config()` with Spectrum project credentials and a managed line, so Docker does not need a Mac. Wiki pages receive suggestions only.

## Phase 6: web app and Sky

- Files: `docs/DESIGN.md`, `apps/scanner`, `apps/web`, shared UI tokens, simulated/cached/live data, and source-add views.
- Tests: data-mode labeling, scan limits, Playwright Sky and repo-view smoke tests, keyboard and reduced-motion checks, 500-satellite frame measurement.
- Assumptions: the public Sky has no runtime tier. Simulated data is visibly labeled and excluded from findings.

## Phase 7: browser extension

- Files: `apps/extension` popup, background and content scripts, shared evidence rendering, Manifest V3, and build output.
- Tests: unpacked Chromium fixture pages verify quote states, tooltip, scan request, and URL-only request payloads.
- Assumptions: optional host permissions are requested when users add a docs domain.

## Phase 8: proof and polish

- Files: `evals/`, `docs/STAGE.md`, `docs/SELF_HOST.md`, root `README.md`, `deploy/groundcontrol.service`, `Dockerfile`, and `docker-compose.yml`. Docker Compose runs the single Bun server and SQLite volume locally with optional keys from `.env`.
- Tests: measured evaluations, Docker-only quick-version benchmark, dogfood checks, and 20 consecutive end-to-end rehearsals.
- Assumptions: benchmark results reflect actual runs; if Docker Desktop is unavailable, do not execute model-written tests on the host. Azure setup can follow later without changing local behavior.

## Phase 9: optional private local command

- Files: `apps/cli` for an explicit command against an owned private checkout if the user asks to continue. No public-repository runtime sandbox is planned.
- Tests: reject public checkout targets; accept owner-selected private checkout fixtures and preserve the existing safe check allowlist.
- Assumptions: npm publication remains a human action. Existing `seed-plan` plus `node --test flightchecks` supports a manually reviewed private checkout without the optional CLI.
