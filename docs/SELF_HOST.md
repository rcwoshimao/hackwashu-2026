# Run Ground Control locally

This setup uses one Bun server, a built React web app, and a SQLite file in a Docker volume. Docker Desktop is the supported local path. Azure is not needed.

## Hosted instance

Ground Control is hosted at [ground-control-washu26.azurewebsites.net](https://ground-control-washu26.azurewebsites.net). Azure App Service runs the container from `gcwashu26acr.azurecr.io`; SQLite persists under `/home/data`. The seven configured production credentials live in Azure Key Vault `gcwashu26kv` and are referenced by [appsettings.json](../deploy/azure/appsettings.json), which contains no secret values. The web app's managed identity reads the secrets and pulls the image. Local `.env` stays ignored by Git and is not copied into the image.

The [deployment workflow](../.github/workflows/deploy-azure.yml) builds and deploys each push to `main` using a GitHub OIDC credential limited to this repository's main branch. Its Azure IDs are GitHub Actions variables, not secrets. Check the workflow run and `/healthz` after merging changes. To update the five shared Gemini, Spectrum, and GitHub token credentials, change the ignored local `.env` and run `./deploy/azure/upload-secrets.ps1`; Key Vault-backed app settings pick up the latest versions after Azure refreshes them or the app restarts. The production GitHub OAuth app has separate credentials already in Key Vault, so this script deliberately leaves those two entries alone. The App Service B1 plan, Basic container registry, and Key Vault are billable resources.

The production GitHub OAuth app already has the callback `https://ground-control-washu26.azurewebsites.net/auth/github/callback`. First-time hosted sign-in still needs the account owner to approve that app's requested GitHub access.

## Start

1. Start Docker Desktop and open a terminal in the repository root.
2. Copy `.env.example` to `.env` if `.env` is absent. Set `GROUND_CONTROL_PORT` to a free host port and leave `PUBLIC_URL` blank for the local default, or set it to the exact browser origin you will use. This shared workspace uses port `8877`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:<GROUND_CONTROL_PORT>`. Check `docker compose ps` and `http://localhost:<GROUND_CONTROL_PORT>/healthz`.

`docker compose logs -f groundcontrol` shows server errors. `docker compose down` stops the service and preserves SQLite data. Do not run `docker compose down -v` unless you intend to erase stored scans, sessions, and trust decisions.

The container serves only on `127.0.0.1` by default. To test from another machine, set up an HTTPS reverse proxy or tunnel, set `PUBLIC_URL` to that HTTPS origin, and configure the matching GitHub OAuth callback.

With GitHub OAuth configured, sign in and open **My repos** (`/signin`). The header displays your GitHub login. The account page automatically lists up to 500 recently updated repositories GitHub says you can access, with search, filters, and 12-row pages. Listing them does not connect or scan them. Choose **Check README** beside one eligible public repo, or **Scan all personal projects** to request static and optional AI checks for eligible public projects under your username. Private and organization repos are excluded from that bulk action. The signed-in Sky also shows unscanned account repositories in a holding orbit and offers a bulk public scan. Private repos require an explicit **Connect** action before CI checks; personal public repos can use **Enable deep checks**. Neither is part of the bulk public scan. If `SESSION_SECRET` is blank, GitHub OAuth's configured client secret provides a stable, separate derived session key across restarts; changing either value ends existing sessions.

## Add keys in `.env`

| Goal | Variables | Result |
| --- | --- | --- |
| Real top-500 Sky scan | `GITHUB_SCAN_TOKEN`, `GEMINI_API_KEY` | GitHub read-only API access and Gemini claim extraction. |
| Optional Claude claim extraction for connected sources and local checkouts | `EXTRACTION_MODEL=claude`, `ANTHROPIC_API_KEY` | Uses Claude Sonnet 5 for those sources; public Sky scans continue to use Gemini or static checks. |
| Sign in and connect repos | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, optional `SESSION_SECRET`, `PUBLIC_URL` | GitHub OAuth callback at `<PUBLIC_URL>/auth/github/callback`. |
| GitHub commit status, PR comments, and verified iMessage routing | `GITHUB_WRITE_TOKEN` | Server-side GitHub access scoped to connected demo repos; resolves the checked commit's GitHub author before an alert. |
| iMessage alerts | `SPECTRUM_PROJECT_ID`, `SPECTRUM_PROJECT_SECRET` | Spectrum Cloud iMessage through a line provisioned in that project. No Mac or bot token is needed. |
| Confluence source comments | `CONFLUENCE_SITE`, `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN` | Read pages and post footer comments. The page body is never edited. |
| Extension sign-in | `EXTENSION_ID` | Limits the OAuth redirect to the unpacked extension's exact Chrome ID. |

After changing `.env`, run `docker compose up -d` so Compose recreates the container with the new environment. Keep `.env` out of Git. The API and scanner never need a project repository's runtime secrets.

Verify each configured external service before a demo:

```sh
docker compose exec groundcontrol bun ops ping-github
docker compose exec groundcontrol bun ops ping-models
```

`ping-github` needs a GitHub scan or write token and reports the API quota remaining. `ping-models` needs `GEMINI_API_KEY` and checks both configured Gemini models. Run only the diagnostic for services you configured; either command exits with an error when its key or service is unavailable.

To test iMessage, provision a managed iMessage line in your Spectrum project, set the two project variables above and `GITHUB_WRITE_TOKEN`, and recreate the container. Sign in to Ground Control with GitHub, open **Connect a repo**, and enter your iMessage phone number in E.164 format such as `+15551234567`. Ground Control sends a one-time code to that number. Reply with the `LINK <code>` line in the received iMessage; a welcome reply confirms the link. Only that linked sender can act on its alerts. A confirmed drift can then send one grouped message, and `FIX`, `KEEP`, and `IGNORE` are handled by reply. Spectrum Cloud uses an outbound provider connection from the container; iMessage linking itself does not need an HTTPS tunnel. Leave the Spectrum variables empty for a keyless web and simulator demo.

The AI tier sends README and connected source text to Gemini. This also applies to Confluence and external docs pages you choose to connect. Leave `GEMINI_API_KEY` blank for local static checks only. Do not connect confidential content to Gemini without your organization's approval.

When `EXTRACTION_MODEL=claude` is set, connected source extraction sends that source text to Claude instead. The server requires `ANTHROPIC_API_KEY` in that mode. Decide which external model may receive private documentation before enabling either key.

## Scan public repos

From the web app, paste a public `owner/repo` and use **Check this README**, or select one from **My repos**. An unknown repo offers the button; a saved result appears on the next visit. Public scans fetch the default branch README and package metadata, validate exact quote locations, run static checks, and cache the result by commit SHA. With Gemini configured, claim extraction can use the AI tier. This public scanner never installs dependencies or executes repository code, including for a repo that separately opted in to deep CI checks.

To fill the Sky with actual top JavaScript and TypeScript repos, configure both scan keys and run:

```sh
docker compose exec groundcontrol bun ops sky:scan --top 20 --tiers static,ai
docker compose exec groundcontrol bun ops sky:scan --top 500 --tiers static,ai
```

The larger scan makes many GitHub and Gemini calls, may take a while, and uses your account quota. It selects popular JavaScript and TypeScript repos with a Markdown README and root `package.json`. Results are stored in SQLite; rerunning an unchanged repo reuses its commit result. `sky:simulate --fill-to 500` adds labeled filler only when you need to inspect the layout before a full scan. `sky:export` writes the current snapshot to `/app/data/sky.json` in the Docker volume, including any visibly simulated records; the live Sky uses SQLite. To keep measured results outside the Docker volume, run `sky:save` (writes `/app/data/sky-snapshot.json` with real public scans, runs, sources, and trust, but no simulated, private, or token data), copy it out with `docker compose cp groundcontrol:/app/data/sky-snapshot.json snapshots/`, and load it into a fresh database with `docker compose cp snapshots/sky-snapshot.json groundcontrol:/app/data/` followed by `sky:load`. Loading keeps local connections, private repos, and newer scans.

Rebecca's branch includes a snapshot of 51 measured public scans. Import it into this local database with `docker compose exec -T groundcontrol bun ops sky:load snapshots/sky-snapshot.json`. Existing connections and newer local scans win. The file contains no telemetry tokens.

## Connected repositories

Create a GitHub OAuth app with callback `<PUBLIC_URL>/auth/github/callback`, then sign in through the web app and connect a repository you administer. Private connections show a one-time telemetry token. For a public repo under your signed-in login, choose **Enable deep checks** on **My repos** or select the checkbox on the Connect page; that opt-in also shows a one-time token. Copy it before leaving and save it as that repository's GitHub Actions secret `GROUND_CONTROL_TOKEN`. Enabling deep checks again or reconnecting a private repo rotates the token, so update the secret. An ordinary public connection remains documentation-only. Ground Control rechecks each signed-in viewer's GitHub access before showing private results, caching permission checks for up to ten minutes. If a formerly private connected repo becomes public, reconnecting returns a visibility-change error, invalidates its token, and keeps historical results marked private until the stored data is cleared. New permission checks deny those results. Use a repository you own for the steps below.

Ground Control refreshes connected documentation and publishes generated `flightchecks/` files to the opted-in repository's default branch when `GITHUB_WRITE_TOKEN` has Contents write permission. Review the generated plan and checks on GitHub. A local checkout is only a fallback when publishing fails or when you deliberately want to prepare a PR branch yourself. To use that fallback, run this command **from the Ground Control root** with a checkout you own:

```sh
bun ops seed-plan <checkout> <owner/repo>
```

The fallback command writes `<checkout>/flightchecks/flightplan.json`, `flight.test.mjs`, and `runner.mjs`. It uses local heuristic extraction when `GEMINI_API_KEY` is absent and AI extraction when it is set. Review the plan, install the target project's dependencies when its checks require them, run `node --test flightchecks`, and commit the generated files. These local steps execute your checkout's code. Default-branch source changes also schedule a flightchecks refresh; check the resulting commit or `flightplan_published` event.

The Connect result page gives a copyable `gh secret set GROUND_CONTROL_TOKEN -R <owner/repo>` command; GitHub CLI prompts for the one-time token, so it is not exposed in command history. Enter the target repository's default branch, then download the short [caller workflow](../demo/orbit-app/.github/workflows/ground-control.yml) and add it at `.github/workflows/ground-control.yml`. The hosted server URL is already filled in. The caller invokes the [maintained reusable workflow](../.github/workflows/ground-control-reusable.yml), which runs on pull requests and default-branch pushes without a duplicate feature-branch push run. Its check job skips fork PRs and runs without the telemetry secret; its report job receives the secret. The Action validates repository identity and the committed plan before importing the runner. Report mode rejects telemetry whose repository, commit SHA, or PR number differs from the workflow context. Because authors can edit a branch's generated runner, treat its status as advisory for untrusted PR authors until trusted attestation is added. The hosted server is `https://ground-control-washu26.azurewebsites.net`; the target project needs no Azure deployment. Fork pull requests do not receive the token.

Add documentation sources through `groundcontrol.yml` or the web app. README and `docs/**/*.md` are discovered during connected source refresh. The web app can add and refresh Confluence or external HTTPS pages and shows their fetch status. On a default-branch source change in an opted-in repository, the server records a snapshot, regenerates the plan, and schedules publication when the write token is configured; the GitHub writer rechecks visibility before committing. Check the resulting commit before the next CI run. A documentation-only public connection does not publish generated flightchecks. Man pages, public GitHub wiki pages, Confluence pages, and external docs pages have distinct source locations. Private GitHub wiki sync is unavailable. A Confluence correction is delivered as a footer comment; wiki and external pages receive suggestions or evidence instead of edits.

## Chrome extension

Build the extension from this root. When `PUBLIC_URL` is blank, it calls `https://ground-control-washu26.azurewebsites.net`. For a local server or an HTTPS tunnel, set `PUBLIC_URL` to that server's origin before building:

```sh
bun run build:extension
```

Open Chrome's Extensions page, enable Developer mode, load unpacked `apps/extension/dist`, and copy the assigned extension ID. For a local server, set `EXTENSION_ID` in `.env` and recreate its container with `docker compose up -d`. For the hosted server, configure that same ID as its `EXTENSION_ID` setting. Then sign in from the extension popup. The popup can check an unknown public GitHub README or watch a Confluence or docs page for one of your connected repositories. Watching another docs host asks for that host's permission at the time you choose Watch. If a page does not show marks immediately, reload it.

## Local tests

With the Docker service running, rehearse the keyless drift:

```sh
docker compose exec -T groundcontrol bun ops fly
```

The simulator uses a temporary copy of Ground Control's bundled `demo/orbit-app` fixture and chooses a free local port. It reports a passing baseline, applies the port drift patch, and shows the failed claim and dependent skips. It runs only that bundled fixture after this explicit command; it never fetches or executes a public GitHub repository.

To exercise a checkout you own, run `bun run gc scan --owned <checkout>` from the Ground Control root to create and run its flight checks. Use `bun run gc check --owned <checkout>` for later reruns. A Git remote is not required. Review the generated `flightchecks/flightplan.json` and any runtime commands before installing that checkout's dependencies. The flag is your explicit local execution choice and is not a GitHub ownership proof; `--private` remains supported for private checkouts. These are local workspace scripts; no npm package has been published.

To run the code checks on the host, install Bun and run `bun install` and `bun run check` from the Ground Control root. A host drift run also needs Node.js: run `npm ci` in `demo/orbit-app` if its `node_modules` directory is absent, then run `bun ops fly` from the Ground Control root.
