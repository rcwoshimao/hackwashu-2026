# Rebecca's changes: integration notes

For Hussein and his coding agent. Branch: `rebecca`. Base: `hussein` at `d76ef7e`.

## A. Already merged into `hussein` (via `2c7accf`)
Summary only, so nobody reverts these by accident.

- **Public Sky scan** (`packages/scanner`)
  - `scanTop` pulls the star ranking lazily: one search page at a time, JS and TS merged by stars (`src/ranking.ts`). It no longer runs 20 searches up front.
  - Search calls are spaced `githubSearchIntervalMs`, and `src/github-retry.ts` waits out GitHub `retry-after`, quota-reset and secondary limits.
  - `minCheckableClaims = 1` in `config/limits.ts`, down from 3.
  - `reusePublicScan` relabels cached satellites from saved results.
- **Snapshots:** `ops/sky-snapshot.ts` adds `sky:save` and `sky:load`, covering real public scans, runs, sources and trust. Simulated repos, private repos and token hashes are excluded. The committed data is `snapshots/sky-snapshot.json`.
- **Sky motion** (`apps/web/src/sky/motion.ts`): the chart turns every 5 minutes, and each mark glides within its topic sector. Radius (README lag) is never animated. Reduced motion is static.
- **Source sync** (`packages/source-sync`)
  - `web.ts` `pinnedLookup` answers `options.all` with an address list. Before this, every "Public docs URL" fetch failed with `http_error`.
  - `SourceSync.refresh(id, token, { waitForPlan })` defaults to `true`. `apps/api/src/routes-sources.ts` passes `false`, so the web add/refresh returns after the fetch while plan regeneration continues in the background. The old behaviour outlasted the browser's 20 s `apiTimeoutMs`.
- **Web shell**
  - The header is now `The Sky | My reports | avatar` (`components/AccountMenu.tsx`).
  - New `/reports` page (`reports/ReportsPage.tsx`), reusing the exported `RunList`. `/reports` is added to `spaPath` in `apps/api/src/web.ts`.

## B. On `rebecca`, not yet in `hussein`

### 1. Chrome extension removed (product decision: keep the docs-to-tests loop, the Sky and iMessage only)
- **Deleted:** `apps/extension/`, `apps/api/src/page-source-match.ts`, `apps/api/test/page-claims.test.ts`, `packages/copy/src/extension.ts`.
- **Routes removed:** `GET /auth/extension`, the `.chromiumapp.org` redirect branch in `/auth/github/callback`, and `GET /api/page-claims` together with its helpers in `routes-read.ts`.
- **Config:**
  - `EXTENSION_ID` removed from `main.ts` (no longer passed to `AuthService`), `docker-compose.yml` and `.env.example`.
  - `build:extension` script and `@types/chrome` removed.
  - `"chrome"` dropped from `tsconfig.json` types.
  - `bun.lock` regenerated. `@fontsource/*` resolved 5.2.6 → 5.3.0.
- **Docs updated:** SELF_HOST, HUMAN_SETUP (step 11), STAGE (step 7), README, README-START-HERE, API_CONTRACT, HUSSEIN_HANDOFF, PLAN.
- **Left for you:** the unused `"extension"` mode in `packages/auth/src/oauth.ts` and `types.ts` (`invalid_extension`). It's inert now, but I didn't touch your auth package.
- **Expected conflicts** with your newer `hussein`:
  - `api.test.ts`, `routes-read.ts`, `routes-auth.ts`, `main.ts`
  - `packages/copy/src/index.ts`, `docs/*`
  - `bun.lock`: resolve by deleting `apps/extension` and running `bun install`.
- Don't reintroduce `/api/page-claims`.

### 2. "Run a check" button: dropped
I built a /reports button that called `POST /api/scan`, but it overlapped with your live-reloading `useRepo` and Sky scan actions, so I removed it before committing. One gap remains: a public connected repo on /reports has no way to start a scan from that page.

## C. Bugs found, not fixed (still present on `hussein`)
1. **Copy key collision.** `runUnverified` exists in both `messages.ts:60` and `web.ts`. `messageCopy` spreads last, so `RunPage` shows "I haven't verified a way to run {repo} yet…" instead of "Unverified".
   - Fix: rename the web key.
   - Also add a duplicate-key check to `lintCopy`.
2. **Unverified shown as Disputed.** In `packages/scanner/src/assessment.ts:52`, public-scan `unverified` results become `disputed` (and that trust is stored), so the run page offers Confirm/Drop for claims that were never run.
   - Fix: store `unconfirmed` and no trust for `unverified`.
   - Show Confirm/Drop only for `pass`/`fail`.
3. **Extraction noise.** On `rcwoshimao/two-grains-of-salt`, Gemini classified blog front-matter fields (`slug`, `title`, `date`, `content`) as `env_var` claims.
4. **Lint.** `bun run check` fails `biome format` on `apps/api/src/routes-account.ts`, `apps/api/test/account-repos.test.ts` and `packages/auth/src/github.ts`.

## Verification on `rebecca`
All of these were run in Docker:
- `bun run test`: 220 pass. That's 12 fewer, from the removed extension and page-claims tests.
- `tsc --noEmit`, `copy:lint` and `golden` (5) pass.
- `/auth/extension` and `/api/page-claims` return 404.
