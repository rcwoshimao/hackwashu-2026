# Run Ground Control locally

This setup uses one Bun server, a built React web app, and a SQLite file in a Docker volume. Docker Desktop is the supported local path. Azure is not needed.

## Start

1. Start Docker Desktop and open a terminal in the repository root.
2. Copy `.env.example` to `.env` if `.env` is absent. Set `GROUND_CONTROL_PORT` to a free host port and leave `PUBLIC_URL` blank for the local default, or set it to the exact browser origin you will use. This shared workspace uses port `8877`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:<GROUND_CONTROL_PORT>`. Check `docker compose ps` and `http://localhost:<GROUND_CONTROL_PORT>/healthz`.

`docker compose logs -f groundcontrol` shows server errors. `docker compose down` stops the service and preserves SQLite data. Do not run `docker compose down -v` unless you intend to erase stored scans, sessions, and trust decisions.

The container serves only on `127.0.0.1` by default. To test from another machine, set up an HTTPS reverse proxy or tunnel, set `PUBLIC_URL` to that HTTPS origin, and configure the matching GitHub OAuth callback.

With GitHub OAuth configured, sign in and open **My repos** (`/signin`). The header displays your GitHub login. The account page automatically lists up to 500 recently updated repositories GitHub says you can access. Listing them does not connect or scan them. Choose **Check README** beside one eligible public repo, or **Scan all public READMEs** to request checks for all eligible public repos in the displayed list. Private repos require an explicit **Connect** action before CI checks; they are not part of the bulk public scan. If `SESSION_SECRET` is blank, the server generates a new signing secret on restart, so you must sign in again after rebuilding the container.

## Add keys in `.env`

| Goal | Variables | Result |
| --- | --- | --- |
| Real top-500 Sky scan | `GITHUB_SCAN_TOKEN`, `GEMINI_API_KEY` | GitHub read-only API access and Gemini claim extraction. |
| Optional Claude claim extraction for connected sources and local checkouts | `EXTRACTION_MODEL=claude`, `ANTHROPIC_API_KEY` | Uses Claude Sonnet 5 for those sources; public Sky scans continue to use Gemini or static checks. |
| Sign in and connect repos | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `PUBLIC_URL` | GitHub OAuth callback at `<PUBLIC_URL>/auth/github/callback`. |
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

From the web app, paste a public `owner/repo` and use **Check this README**, or select one from **My repos**. An unknown repo offers the button; a saved result appears on the next visit. Public scans fetch the default branch README and package metadata, validate exact quote locations, run static checks, and cache the result by commit SHA. With Gemini configured, claim extraction can use the AI tier. Public repositories never have dependencies installed, package scripts run, generated tests run, or project code executed by Ground Control, even when submitted or connected.

To fill the Sky with actual top JavaScript and TypeScript repos, configure both scan keys and run:

```sh
docker compose exec groundcontrol bun ops sky:scan --top 20 --tiers static,ai
docker compose exec groundcontrol bun ops sky:scan --top 500 --tiers static,ai
```

The larger scan makes many GitHub and Gemini calls, may take a while, and uses your account quota. It selects popular JavaScript and TypeScript repos with a Markdown README and root `package.json`. Results are stored in SQLite; rerunning an unchanged repo reuses its commit result. `sky:simulate --fill-to 500` adds labeled filler only when you need to inspect the layout before a full scan. `sky:export` writes the current snapshot to `/app/data/sky.json` in the Docker volume, including any visibly simulated records; the live Sky uses SQLite.

## Connected repositories

Create a GitHub OAuth app with callback `<PUBLIC_URL>/auth/github/callback`, then sign in through the web app and connect a repository you administer. For a **private** connection, the Connect page shows a one-time telemetry token. Copy it before leaving and save it as that repository's GitHub Actions secret `GROUND_CONTROL_TOKEN`. Reconnecting the private repo rotates the token, so update the secret if you reconnect. Ground Control rechecks each signed-in viewer's GitHub access before showing private results, caching permission checks for up to ten minutes. A connected public repository can sync documentation sources and shows a link to add one, but receives no telemetry token, Actions setup, or generated flightcheck commits. If a formerly private connected repo becomes public, reconnecting returns a visibility-change error, invalidates its token, and keeps historical results marked private until the stored data is cleared. New permission checks deny those results. Use a private repository you own for the steps below.

Generate the initial flight checks from a separate local checkout of your connected private repository. Run this command **from the Ground Control root**, with a real checkout path and the same `owner/repo` used on the Connect page:

```sh
bun ops seed-plan <checkout> <owner/repo>
```

The command writes `<checkout>/flightchecks/flightplan.json`, `flight.test.mjs`, and `runner.mjs`. It uses local heuristic extraction when `GEMINI_API_KEY` is absent and AI extraction when it is set. In your private checkout, review the plan, explicitly install the target project's dependencies with `npm ci`, and run `node --test flightchecks`. These local steps execute that private repository's code; do not use them on a public checkout. Commit and push those three generated files **before** the workflow runs. Default-branch source changes can refresh the plan and schedule a flightchecks commit when `GITHUB_WRITE_TOKEN` has Contents write access. Check the resulting commit or `flightplan_published` event. Automatic GitHub publication still needs a live token test. If publication fails or documentation changes on a PR branch, run `seed-plan` against that branch, review, and commit the generated files there before relying on its checks.

Copy [the sample two-job workflow](../demo/orbit-app/.github/workflows/ground-control.yml) into the connected private repo's `.github/workflows/`. Replace `YOUR_GITHUB_USER/ground-control/action@main` with the real public GitHub repository and ref containing this repo's `action/action.yml` and built `action/dist/index.js`. Before checkout or `npm ci`, the flight-checks job checks GitHub's `repository.private` flag and skips runtime work for public repositories. In a private repo, it runs project code without secrets and uploads telemetry; the report job sends it with `GROUND_CONTROL_TOKEN`. Report mode rejects telemetry whose repository, commit SHA, or PR number differs from the workflow context. Because authors can edit a branch's generated runner, treat its status as advisory for untrusted PR authors until trusted attestation is added. Set the repository Actions variable `GROUND_CONTROL_URL` to your server's **reachable HTTPS `PUBLIC_URL`**. GitHub-hosted runners cannot call `localhost`; run an HTTPS tunnel to the Docker host port and set `PUBLIC_URL`, the GitHub OAuth callback, and `GROUND_CONTROL_URL` to that origin. Keep the tunnel running for the whole workflow. The workflow covers same-repo branches; fork pull requests do not receive the token.

Add documentation sources through `groundcontrol.yml` or the web app. README and `docs/**/*.md` are discovered when `seed-plan` runs. The web app can add and refresh Confluence or external HTTPS pages and shows their fetch status. On a default-branch source change in a connected private repository, the server records a snapshot, regenerates the plan, and schedules publication when the write token is configured; the GitHub writer rechecks private visibility before committing. Check the resulting commit before the next CI run. Connected public repositories can sync documentation but cannot publish generated flightchecks. Man pages, public GitHub wiki pages, Confluence pages, and external docs pages have distinct source locations. Private GitHub wiki sync is unavailable. A Confluence correction is delivered as a footer comment; wiki and external pages receive suggestions or evidence instead of edits.

## Chrome extension

Build the extension from this root after setting `.env`. When `PUBLIC_URL` is blank, the build uses `GROUND_CONTROL_PORT` (8877 in this shared workspace). When an HTTPS tunnel is used, set `PUBLIC_URL` to its origin before building, so the extension calls the same server as the browser:

```sh
bun run build:extension
```

Open Chrome's Extensions page, enable Developer mode, load unpacked `apps/extension/dist`, and copy the assigned extension ID to `EXTENSION_ID` in `.env`. Recreate the server container with `docker compose up -d`, then sign in from the extension popup. The popup can check an unknown public GitHub README or watch a Confluence or docs page for one of your connected repositories. Watching another docs host asks for that host's permission at the time you choose Watch. If a page does not show marks immediately, reload it.

## Local tests

With the Docker service running, rehearse the keyless drift:

```sh
docker compose exec -T groundcontrol bun ops fly
```

The simulator uses a temporary copy of Ground Control's bundled `demo/orbit-app` fixture and chooses a free local port. It reports a passing baseline, applies the port drift patch, and shows the failed claim and dependent skips. It runs only that bundled fixture after this explicit command; it never fetches or executes a public GitHub repository.

To exercise a private checkout you own, run `bun run gc scan --private <checkout>` from the Ground Control root to create and run its flight checks. Use `bun run gc check --private <checkout>` for later reruns. A Git remote is not required. Review the generated `flightchecks/flightplan.json` and any runtime commands before installing that checkout's dependencies. The flag is your explicit local execution choice and is not a GitHub visibility proof. These are local workspace scripts; no npm package has been published.

To run the code checks on the host, install Bun and run `bun install` and `bun run check` from the Ground Control root. A host drift run also needs Node.js: run `npm ci` in `demo/orbit-app` if its `node_modules` directory is absent, then run `bun ops fly` from the Ground Control root.
