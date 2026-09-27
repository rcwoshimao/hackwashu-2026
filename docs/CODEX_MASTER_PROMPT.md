# Codex master prompt v2: build Ground Control

Current product decisions (2026-09-26) override conflicting historical text below: Ground Control never installs dependencies, starts processes, or executes code from a public repository, including a connected public repository. Public scans use file inspection and optional AI analysis only. Runtime checks are allowed for a private repository its owner connects, in that repository's own CI or through an explicit local command. The bundled Orbit demo may be run locally on purpose. Phone messaging focuses on iMessage through Photon Spectrum, not Telegram.

This replaces `CODEX_PROMPT.md`. It lives in the repo at `docs/CODEX_MASTER_PROMPT.md`; paste everything below the line into Codex as the first task. After each phase Codex stops and reports; reply with the follow-up prompt at the end of this file to continue.

---

You are the lead engineer building **Ground Control** for a hackathon demo that judges will watch live. Quality beats breadth: a smaller system that works flawlessly on stage beats a bigger one that half works. Build it the way a senior engineer ships a product they must defend in front of experts.

## 0. Read first, in this order

1. `AGENTS.md`: the repo rules. Mandatory in every file you touch.
2. `docs/SPEC.md`: the full build spec. Its section 15 overrides everything earlier in the spec.
3. `docs/vendor/photon/`: the only source of truth for `spectrum-ts`.
4. `docs/vendor/atlassian/`: the only source of truth for the Confluence REST API. If this folder is missing when you reach Confluence work, stop and ask; the human will add it.
5. This prompt. **Where this prompt and the spec disagree, this prompt wins.**

Before writing code, create two files:

- `docs/PLAN.md` (under 150 lines, kept current): for each phase, the files you will create, the tests you will write, and every assumption you are making.
- `docs/HUMAN_SETUP.md`: every step only a person can do (accounts, keys, tokens, settings, publishing). Each step gets a numbered action, where its value goes, and how to tell it worked. Start from spec section 16 and add each new item from this prompt. Update it at the end of every phase.

Never guess an external API (spectrum-ts, Octokit, `@google/genai`, Atlassian). Use only vendored docs and installed type definitions, or stop and ask.

## 1. What Ground Control is

Ground Control turns documentation into tests: README files, the `docs/` folder, the GitHub wiki, your CLI's man page, Confluence pages, and public docs pages that describe your code.

- When code changes and a doc no longer matches, a check fails.
- The author of the breaking commit gets one iMessage listing every doc affected.
- Replying FIX delivers a correction suited to each source, tested first where possible.
- The Sky scans popular public repos with the same engine and draws each as a satellite whose brightness is how true its README is.

A developer could hack a quick version with a workflow that asks an AI to write tests. That version fails in four ways, and **fixing those four is the product**:

1. The AI writes different tests every run, so results are flaky.
2. The AI can write wrong tests, and running AI-written code in a pipeline is a security risk.
3. When a test fails, nobody can tell whether the doc is wrong or the test is wrong.
4. A failed test log doesn't tell anyone what to fix.

## 2. Product decisions (settled; build exactly this)

| Surface | Covers | Runs project code? | Who sees results |
| --- | --- | --- | --- |
| The Sky | The top 500 public JavaScript and TypeScript repos, plus repos people submit | No. Static and AI tiers only | Everyone |
| Connected public repos | README, `docs/`, wiki, man page, linked Confluence and web pages | No; documentation inspection only | Everyone |
| Connected private repos | README, `docs/`, wiki, man page, linked Confluence and web pages | Yes, in that repo's own CI | People with access to that repo |
| Local command (optional) | Your private checkout on your machine | Yes, when you explicitly run it | You |

Rules that follow from this table:

- Ground Control never touches a private repo that hasn't been connected, and never runs code from a repo someone merely visits.
- "Check this README" runs the static and AI tiers on the default branch in about a minute. The result is cached by commit, and the repo joins the Sky. Anonymous use is rate-limited to 5 checks per hour per IP.
- The server is one process plus a SQLite file plus environment keys, so any company can self-host it. Ship a `Dockerfile`, `docker-compose.yml` and `docs/SELF_HOST.md`.

## 3. The four reliability guarantees

### G1. Stable checks: the same doc text always produces the same checks

- Checks are committed in the connected repo as `flightchecks/flightplan.json` plus generated test files. They are regenerated only when a source's text changes.
- Every source is normalized to **DocText**: text with headings and code blocks, plus a map back to original positions (section 5.2).
- Split each source's DocText into sections by heading and hash each section (sha256 of normalized text). Unchanged sections reuse their previous claims exactly; only changed sections go to the model.
- Claim IDs are stable: `"c_" + first 10 hex chars of sha256(sourceId + "\n" + normalizedQuote + "\n" + kind + "\n" + canonicalJson(params))`.
- Cache every model call by `(promptVersion, model, sha256(input))`. Re-extracting unchanged text makes zero model calls.
- `planToTests` is deterministic: same plan, byte-identical test files. Prove it with a property test.
- Runtime checks retry once after a clean restart, and only two consecutive failures count.
  - A pass after a failure is recorded as `flaky` and never alerts.
  - A claim that is flaky in more than 2 of its last 10 runs becomes `disputed` with the reason "flaky."

### G2. Safe check types only: the AI never writes code that runs

- The model may only choose from the nine whitelisted kinds in spec section 15.4, with zod-validated parameters. Anything else is dropped and logged.
- Test files come only from `planToTests`. Every check is executed by our runner.
- A command runs only if it appears verbatim in a source's code block or in a `package.json` script, and its first word is one of npm, pnpm, yarn, bun, node, npx, cp, mkdir or touch. Anything else is stored as `unverified` and never runs.
- Project code runs only for connected private repos in their own CI job with no secrets, in an explicitly invoked private local checkout, or in the bundled local Orbit demo simulator. Public repository code never runs.

### G3. Confirm each check once before trusting it

Trust states are stored on the server, not in the repo, to avoid commit loops.

| State | Meaning | Can alert or fail the verdict? |
| --- | --- | --- |
| `unconfirmed` | New or changed claim, not yet run | No |
| `confirmed` | Passed on its confirmation run | Yes |
| `disputed` | Failed on its confirmation run, or became flaky | No; shown for human review |
| `dropped` | Removed by a human | No; never regenerated for the same quote |

- A claim's confirmation run is the first run after the claim was added. Pass means `confirmed`. Fail means `disputed`: the check is wrong, or the doc was already wrong when written.
- Only confirmed claims can raise drift, fail the verdict, or text anyone.
- Humans resolve disputes with `/groundcontrol confirm <id>` or `/groundcontrol drop <id>` in a pull request, `CONFIRM <id>` or `DROP <id>` by Telegram, or the buttons on the run detail page.
- CONFIRM means the check is right. If the claim is failing right now, that opens drift immediately and offers FIX.
- DROP commits the claim's removal from `flightplan.json` and adds its quote hash to `flightchecks/dropped.json`.

### G4. Evidence and a fix, not a log

- Build one `Evidence` object per failing fact, and render the pull request comment, the Telegram message and the dashboard from it.
- **Group by fact.** Claims with the same kind and parameters across sources become one evidence group, for example "port 3000 appears in 3 docs."
- Each claim in a group records:
  - its source, location and exact quote;
  - expected and actual results, with output trimmed to 20 lines;
  - `lastPassSha` and `firstFailSha`, and the related files changed between them (from the GitHub compare API);
  - the suspected commit and author;
  - a deep link;
  - the fix delivered for its source kind (section 5.4).
- **Deep links use text fragments:** `<page url>#:~:text=<start>,<end>`, URL-encoded per the spec, so the browser scrolls to the sentence and highlights it. For repo files, add GitHub's line anchor as well.

## 4. The CI verdict model

- The workflow's `flight-checks` job writes telemetry and exits 0 whenever the runner itself worked. It exits non-zero only if the runner crashed.
- The server computes the verdict from trust states and posts a GitHub commit status named `Ground Control`: `success` or `failure`, with a one-line description and a link to the run detail page.
- Unconfirmed and disputed claims never block anyone.
- The server's write token needs "Commit statuses: read and write" (add this to `docs/HUMAN_SETUP.md`).

## 5. Doc sources

### 5.1 Kinds of source

| Kind | Where it comes from | Refresh trigger | Location stored |
| --- | --- | --- | --- |
| `readme` | `README.md` in the repo, automatic | CI on every push | File path and line range |
| `docs` | `docs/**/*.md` in the repo, automatic | CI on every push | File path and line range |
| `wiki` | The repo's GitHub wiki (`https://github.com/OWNER/REPO.wiki.git`), when enabled in config | Poll the wiki's HEAD every 10 minutes | Wiki page name, heading path, quote |
| `man` | A man page file in the repo, such as `man/orbit.1` | CI on every push | File path and rendered line range |
| `confluence` | Confluence Cloud pages linked in config or the web app | Poll each page's version number every 10 minutes | Page ID, heading path, quote |
| `url` | A public docs page linked in config or the web app | Poll hourly, using ETag or a content hash | URL, heading path, quote |

- Every source belongs to exactly one connected repo, and its checks run in that repo's CI.
- When any source changes, the server regenerates that repo's flight plan (G1) and commits `flightchecks/` to the default branch with the message `Update flight checks from <source title>`.
- A code change re-checks claims from every source.

### 5.2 Converting each source to DocText

- **Markdown (readme, docs, wiki):** `mdast-util-from-markdown`, keeping positions.
- **Man pages:** a small roff renderer for `.TH .SH .SS .PP .TP .B .I .BR .IR`. Map each rendered line back to its source line. Document the unsupported macros.
- **Confluence:** fetch storage format through the REST API v2 (verify endpoints in `docs/vendor/atlassian/`).
  - Map `h1` to `h6` to headings and paragraphs and list items to text.
  - Map the code macro (`ac:structured-macro` named `code` with `ac:plain-text-body`) to a code block, so commands inside it stay runnable claims.
- **Web pages:** fetch with a 10-second timeout and a 2 MB limit, extract the main content with `@mozilla/readability` on `linkedom`, then map headings and `pre` blocks.

### 5.3 How sources get added

1. **Automatic:** `README.md`, `docs/**/*.md`, and the wiki if `wiki: true`.
2. **`groundcontrol.yml` in the repo**, validated by zod:

```yaml
sources:
  - readme: README.md
  - docs: docs/**/*.md
  - wiki: true
  - man: man/orbit.1
  - confluence:
      site: yourteam.atlassian.net
      pages:
        - https://yourteam.atlassian.net/wiki/spaces/ENG/pages/123456/Orbit+onboarding
  - url: https://orbit-docs.example.com/getting-started
    owner: github-username
```

3. **The web app:** "Add a source" accepts a pasted Confluence page link, space link or docs URL, then the repo it describes.
Sources added in the web app are stored on the server, and the plan records them the same way as config sources.

### 5.4 How fixes are delivered, by source

| Kind | What FIX does |
| --- | --- |
| `readme`, `docs`, `man` | A verified correction branch and pull request, exactly as in spec section 15.7 |
| `wiki` | A suggested patch in the message and dashboard, with a "Copy fix" button. Never write to the wiki. |
| `confluence` | A footer comment on the page with the evidence and suggested wording, through the REST API. Never edit the page body. |
| `url` | Evidence only, sent to the source's `owner` |

**One alert per breaking commit.** It lists every affected source, for example: "Your commit a1b2c3d moved the server to port 8080. Three docs still say 3000: README line 42, wiki page Getting Started, Confluence page Orbit onboarding. Reply FIX." FIX delivers each fix in parallel and replies with one summary.

## 6. Sign-in and visibility

- **GitHub sign-in** (an OAuth app the human creates) for the dashboard. The callback is `PUBLIC_URL/auth/github/callback`.
- **Private results:** show a private repo's results only if the signed-in user's token can read it (the GitHub repo endpoint returns 200). Re-check at most every 10 minutes per user and repo.
- **Public results:** the Sky and results for public repos need no sign-in.
- Sessions last 7 days.
- **Confluence credentials:** for the hackathon, one site through environment variables (`CONFLUENCE_SITE`, `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN`), stored only on the server. Design the source model so per-team credentials can be added later.
- **The AI tier sends source text to Gemini.** State this plainly in `docs/SELF_HOST.md` and on the web app's "Add a source" screen.

## 7. Web source review

The web app handles public README scan requests, connected source registration, and review of stored claim evidence.

## 8. Engineering non-negotiables

- Follow `AGENTS.md` everywhere: TypeScript strict, no `any`, files under 300 lines, functions under 40, Result types for expected failures, no TODOs, no `console.log`, comments explain why.
- Every external dependency sits behind a port with a real adapter and a fake:

| Port | Real adapter | Fake |
| --- | --- | --- |
| Models | Gemini (`@google/genai`) | Answers from fixtures keyed by input hash |
| GitHub | Octokit | `LocalGit`, which drives a local git repo through the git CLI |
| Messaging | Spectrum Telegram | Records outbound messages; tests inject inbound ones |
| Confluence | REST API v2 | In-memory pages, versions and comments |
| Web pages | fetch | Fixture HTML |

- Unit tests never touch the network or need a secret.
- Never write, log, commit or print a secret. `.env.example` lists every variable with a one-line comment.
- Every external call has a timeout, typed errors, and bounded retries with backoff.
- Every user-facing string lives in `packages/copy` and passes the copy linter (spec section 10.4).
- **Dogfood:** Ground Control's own README must pass its own flight checks by the final phase.

## 9. Stack

- Bun with Hono on port 8787, SQLite through `bun:sqlite`, Server-Sent Events at `/api/events`.
- Vite, React and TypeScript for the web app. The Sky uses Canvas 2D with d3 scales.
- `spectrum-ts` 12.10.x (pin it) with `spectrum-ts/providers/telegram`. In cloud mode (project ID and secret set), the Telegram webhook registers itself and inbound messages arrive on the `app.messages` stream, so run one inbound loop in the server process instead of building a webhook route. Proactive messages use `telegram(app).user(id)` and `space.create(user)`, as shown in `docs/vendor/photon/pages/providers_telegram_conversations-and-features.mdx`. Dedupe inbound work on `message.id`.
- `@google/genai` with `gemini-3.8-flash` and `gemini-3.5-flash-lite` (spec section 15.11). Never use thinking level `minimal` on 3.8 Flash. Use structured output with JSON schemas.
- The Action: JavaScript, `runs.using: node24`, bundled to `action/dist/index.js` and committed.
- Generated flight checks run with `node --test` and import `./runner.mjs`.
- Biome, zod, fast-check, Octokit, `mdast-util-from-markdown`, `@mozilla/readability`, `linkedom`, Playwright for smoke tests.
- Monorepo additions to spec section 7.2:
  - `packages/sources`: source adapters and DocText conversion;
  - `packages/auth`: GitHub sign-in, sessions and access checks;
  - `apps/cli` (optional phase);
  - `deploy/`: the systemd unit, Dockerfile and compose file.

## 10. Phases: work in order and stop after each

At the end of every phase, update `docs/PLAN.md` and `docs/HUMAN_SETUP.md`, then report using section 12 and stop.

### Phase 1: Foundation

**Build:**
- The monorepo, tooling, `bun run check`, `.env.example`, and the `bun ops` skeleton.
- Core schemas: sources, DocText, claims with generalized locations, the nine check kinds, trust states, `Evidence` with fact grouping, stable claim IDs.
- The candidate finder.
- The five static check kinds.

**Done when:**
- `bun run check` passes.
- Property tests prove claim IDs are stable and quotes are exact substrings of their locations.
- `bun ops candidates <file>` works on five sample READMEs in `fixtures/readmes/`.

### Phase 2: Demo content, generated tests, runtime checks

**Build:**
- `demo/orbit-app` as in spec section 15.12, plus a `man/orbit.1` man page documenting the CLI flags.
- `demo/orbit-app-wiki/` with a "Getting Started" page.
- `demo/confluence/orbit-onboarding.md`, a page the human will paste into Confluence.
- All three doc sets state the same port, commands and environment variables as the README, so one drift breaks all three.
- The 20 drifts as patches in `demo/orbit-app/drifts/`, and `bun ops demo:branches` to turn them into branches when publishing.
- `planToTests`, the single-file `runner.mjs`, and the four runtime check kinds with process-group cleanup, the never-set-PORT rule and retry-once.

**Done when:**
- `node --test flightchecks` passes on orbit-app main with a hand-written plan fixture.
- `drifts/port-8080.patch` fails exactly the port check, naming its line.
- A test proves the process group is killed even when a check throws.

### Phase 3: Sources, extraction, trust, evidence

**Build:**
- DocText converters for Markdown, man pages, Confluence storage format and web pages, with position maps.
- The AI gateway and `extract_claims`, with section hashing and caching.
- The trust-state machine.
- The evidence builder, with fact grouping and text-fragment links.

**Done when:** tests with fakes prove:
- unchanged text makes zero model calls;
- editing one section re-extracts only that section;
- a claim that was wrong when written becomes `disputed`;
- the port fact from README, wiki and Confluence groups into one evidence object;
- golden renders of the pull request comment, Telegram message and tooltip data match.

Also list `bun ops extract <file>` for the human to run with a real key.

### Phase 4: Server, CI, sign-in, local simulator

**Build:**
- Every endpoint in spec section 15.9, plus the source endpoints.
- The verdict model and GitHub sign-in with visibility rules.
- `bun ops register`, `seed-plan`, `ping-github` and `ping-models`.
- Server-side regeneration, and polling for wiki, Confluence and URL sources.
- The Action in run and report modes, and the orbit-app workflow file from spec section 14.9.
- `bun ops simulate-ci <path> [--patch <file>]`, which runs the run and report logic locally against `LocalGit` and the local server.

**Done when:** an integration test proves:
1. simulating orbit-app main confirms every claim;
2. the port patch opens one drift covering three sources, with a failing verdict;
3. a signed-out request cannot see a private repo's results.

### Phase 5: Messaging and fixes

**Build:**
- Telegram through Spectrum: the inbound loop on `app.messages`, `link-token`, every command in spec section 15.8 plus CONFIRM and DROP, and one alert per breaking commit.
- Pull request comments.
- The FIX flow for every source kind in section 5.4.
- Verified answers to "how do I run."

**Done when:** a fully local end-to-end test with fakes proves "one change, three docs caught":
1. The drift is detected.
2. One alert lists all three docs.
3. FIX produces a correction branch that passes the simulated CI, a wiki patch message, and a Confluence footer comment.
4. The fake messenger captures the summary.
5. "How do I run orbit-app" returns the new port.

### Phase 6: The web app and the Sky

**Build:**
- Scanner: static and AI tiers, `sky:scan`, `sky:export`, `sky:simulate --count 500 --seed 42`, and the on-demand scan endpoint with rate limits.
- Data modes `live`, `cached` and `simulated`, with the labeling rules in spec section 15.10 enforced in code.
- Screens:
  - the Sky, with legend, evidence panel, findings and live arrivals;
  - text-a-repo;
  - the repo view with the trajectory view;
  - the run detail page with confirm and drop buttons;
  - "Add a source";
  - sign-in;
  - a stage layout at 1920 by 1080.

**Design process, required:**
1. First write `docs/DESIGN.md`: 4 to 6 named hex colors, typefaces and roles, a layout sketch per screen, and three principles.
2. Ground choices in flight consoles, orbital diagrams, star charts and navigation plots.
3. Avoid generic defaults: identical rounded cards with soft shadows, gradient washes, one acid accent on near-black, and tracked all-caps labels.
4. Status words render in sentence case with a symbol and never rely on color alone.
5. One color means drift and nothing else.
6. Spend boldness on the Sky; keep everything else quiet.

**Quality floor:** visible keyboard focus, reduced motion respected, WCAG AA contrast, the Sky at 60 fps with 500 satellites, no placeholder numbers, and empty states that say what to do next.

**Done when:**
- `bun run build:web` passes.
- Playwright smoke tests render the Sky from a simulated fixture (legend, simulated label, evidence panel) and the repo view from the phase 4 fixture.
- Your report describes or screenshots each screen.

### Phase 7: Proof and polish

**Build:**
- **Evaluations** from spec section 8.4. Commands needing real keys go in your report.
- **The quick-version benchmark, `bun ops benchmark-diy demo/orbit-app --runs 10`:**
  1. Each run asks the model to write a node:test file verifying the README against the repo, then executes it only inside a disposable Docker container (`node:24`, `--network none`, only PATH and HOME set, a 60-second limit) on a temporary copy.
  2. Then run Ground Control 10 times on the same commit.
  3. Write `evals/diy-vs-ground-control.md` with tests per run, verdict agreement across runs, false alarms on a correct README, whether failures name a doc line, and runtime.
  4. Record only what happened. If Docker is unavailable, stop and report; never run model-written code on the host.
- `bun ops fly <repo>`, the fast local fallback.
- `docs/STAGE.md`: the stage runbook for spec section 13, with the "one change, three docs caught" beat.
- `deploy/groundcontrol.service`, `Dockerfile`, `docker-compose.yml` and `docs/SELF_HOST.md`.
- Ground Control's own README, passing its own flight checks.

**Done when:**
- The benchmark file holds real results.
- The dogfood run passes.
- Twenty consecutive runs of the phase 5 end-to-end test pass.

### Phase 8 (optional, only after phase 7): the private local command

- **`apps/cli`**, exposing `ground-control check [--path .]`:
  - It runs the same checks on the local checkout.
  - It extracts with the user's own `GEMINI_API_KEY`, or through `--server <url>`.
  - It prints evidence in the terminal.
  - Publishing to npm is a human step.
- Do not add a runtime tier for public repositories.

## 11. Messages to add to the copy deck

| ID | Text |
| --- | --- |
| drift.alert.multi | Your commit {sha} {change}. {count} docs still say {claim}: {locations}. Reply FIX for corrections, KEEP if the docs are right, or IGNORE. |
| fix.summary | Done. {prLine} {wikiLine} {confluenceLine} |
| fix.wiki | Suggested fix for wiki page {page}: {patchLink} |
| fix.confluence | Posted a comment with the correction on Confluence page {page}. |
| claim.disputed.pr | Couldn't confirm the check for {location}: "{quote}" failed on the commit that added it ({sha}). The check may be wrong, or the doc was already wrong. Comment `/groundcontrol confirm {id}` to trust it or `/groundcontrol drop {id}` to remove it. |
| claim.disputed.text | {location} has a check I couldn't confirm. Reply CONFIRM {id} to trust it or DROP {id} to remove it. |
| confirm.done | Confirmed. {location} is now checked on every change. |
| confirm.drift | Confirmed. The check fails right now, so {location} looks wrong. Reply FIX for a tested correction. |
| drop.done | Dropped the check for {location}. It won't come back unless that sentence changes. |
| status.flaky | The check for {location} was unreliable, so it's paused until someone confirms it. |
| scan.limit | You've used this hour's free checks. Try again later or sign in. |
| source.added | Watching {source} for {repo}. First results in about a minute. |

## 12. How to report at the end of every phase

Use exactly these headings:

1. **What works:** each command you ran and a short summary of its output.
2. **What's stubbed or skipped, and why.**
3. **Assumptions you made.**
4. **What the human must do now:** exact, copy-pasteable steps, mirrored in `docs/HUMAN_SETUP.md`.
5. **Demo risks:** anything that could break on stage, and your mitigation.

Then stop.

## 13. Stop and ask instead of guessing when

- an external API behaves differently from its vendored docs or installed types;
- two requirements conflict and this prompt doesn't settle it;
- a step needs a secret, an account, or anything outside the repo;
- a test cannot be made to run offline.

Begin with `docs/PLAN.md` and `docs/HUMAN_SETUP.md`, then phase 1.

---

## Follow-up prompt (send after each phase report)

Continue with phase {N}. First fix anything from your last report marked stubbed that phase {N} depends on. Same rules, same report format, then stop.
