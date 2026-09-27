# Ground Control: rules for every agent in this repo

## Read first
1. `docs/CODEX_MASTER_PROMPT.md` — the build brief and phase order. It overrides the spec where they differ.
2. `docs/SPEC.md` — the full spec. Its section 15 overrides its earlier sections.
3. `docs/vendor/photon/` — the only source of truth for `spectrum-ts`.
4. `docs/vendor/atlassian/` — the only source of truth for the Confluence REST API.

Never guess an external API (spectrum-ts, Octokit, `@google/genai`, Atlassian, Chrome extension APIs). Use the vendored docs and the installed package types, or stop and ask.

## Before you write code
- Keep `docs/PLAN.md` and `docs/HUMAN_SETUP.md` current.
- Public types in `packages/plan`, `packages/runner` and `packages/sources` are frozen once phase 1 is approved. Propose changes in `docs/adr/` first.
- Work in one package per task unless the phase says otherwise.

## Architecture
- `claims`, `plan`, `mapping`, trust-state logic and `labelFor` are pure: no I/O, no clock, no randomness, no environment access.
- Only the nine whitelisted check kinds may execute. Never add a kind that runs arbitrary strings.
- A runtime command must appear verbatim in a doc code block or a `package.json` script, and start with npm, pnpm, yarn, bun, node, npx, cp, mkdir or touch.
- Model output is parsed with zod and is never executed or written as code.
- Test files are produced only by `planToTests`. Never hand-edit or model-write them.
- Every external service sits behind a port with a real adapter and a fake.

## Code
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`.
- Files under 300 lines, functions under 40. Name modules for what they do; no Manager, Helper, Util or Service names.
- Expected failures return Result types. Never catch and ignore.
- Timeouts, limits and thresholds live in config with units in the name (`startTimeoutMs`).
- No TODO, no commented-out code, no `console.log`. Comments explain why, never what.
- Every user-facing string lives in `packages/copy` and passes the copy linter.
- Never write, log, commit or print a secret. `.env` is git-ignored; `.env.example` documents every variable.

## Tests
- Every exported function in `claims`, `plan`, `runner`, `mapping` and `sources` has tests.
- Unit tests never touch the network or need a secret; use the fakes.
- Bug fixes start with a failing test. Never mock our own modules.

## Before you hand back
- `bun run check` must pass: typecheck, lint, tests, copy lint, golden tests.
- Report with the headings in section 12 of the master prompt, then stop.
