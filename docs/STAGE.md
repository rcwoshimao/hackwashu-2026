# Ground Control local demo runbook

This runbook uses Docker Desktop for the server and a disposable copy of Ground Control's bundled Orbit fixture for the drift reveal. Keep the server and SQLite volume running between rehearsals. Public GitHub repositories are static and optional AI scan targets only; the runtime demo uses either that bundled fixture or a private repository you explicitly connect.

## Before the audience arrives

1. Start Docker Desktop in this repository and run `docker compose up --build -d`.
2. Check `docker compose ps` and open `http://localhost:<GROUND_CONTROL_PORT>/healthz` (8877 in this shared workspace). The response is `ok`.
3. Open the Sky at `http://localhost:<GROUND_CONTROL_PORT>/sky`. The initial three satellites are visibly simulated and excluded from measured findings. Real scans show a commit SHA and the tiers run.
4. After putting keys in the ignored `.env`, run `docker compose exec groundcontrol bun ops ping-github` and `docker compose exec groundcontrol bun ops ping-models`. Then scan 20 real repos before attempting 500:

   ```sh
   docker compose exec groundcontrol bun ops sky:scan --top 20 --tiers static,ai
   docker compose exec groundcontrol bun ops sky:scan --top 500 --tiers static,ai
   ```

5. Run `docker compose exec groundcontrol bun ops sky:export` to save the current Sky snapshot at `/app/data/sky.json` in the Docker volume. It retains simulated labels. The live SQLite data remains the server's source of truth.
6. For the connected repo demo, sign in and connect a **private test repo you own**, then save the Connect page's one-time telemetry token as that repo's Actions secret `GROUND_CONTROL_TOKEN`. Before enabling the workflow, run `bun ops seed-plan <checkout> <owner/repo>` **from the Ground Control root** against its private checkout. Review the plan, explicitly run `npm ci` and `node --test flightchecks` in that checkout, and commit the generated `flightchecks/flightplan.json`, `flight.test.mjs`, and `runner.mjs`. Copy `demo/orbit-app/.github/workflows/ground-control.yml` to the private test repo, replace its `YOUR_GITHUB_USER/ground-control/action@main` reference with a public Action repo/ref you control, and set the Actions variable `GROUND_CONTROL_URL` to the HTTPS `PUBLIC_URL`. The workflow checks GitHub's private-repo flag before checkout, dependency installation, or tests.

## The one-change reveal

1. Open the Orbit README, wiki Getting Started page, and Confluence onboarding fixture. Each states the same server port; local Markdown fixtures are the content reference for the talk.
2. Run `docker compose exec -T groundcontrol bun ops fly` from the Ground Control root. This copies the bundled `demo/orbit-app` fixture into a temporary checkout inside the container, confirms the baseline, applies the port patch, and runs the checks again. It never fetches or executes a public GitHub repository. The source fixture is untouched. A host fallback needs Bun and Node.js: run `bun install` in this repository and `npm ci` in `demo/orbit-app` if its `node_modules` directory is absent, then run `bun ops fly` from the repository root.
3. Show the output: the baseline has 17 passes; the port edit fails two README claims citing the old port (lines 24 and 30). They group into one port fact, and dependent HTTP checks skip because their prerequisite server is absent. This is a local rehearsal against a bundled fixture invoked explicitly. Public scans and page visits never run repository code.
4. If GitHub Actions and iMessage have been configured, repeat the port edit in the connected **private** test repository whose generated flight checks and workflow are already committed. Show the grouped evidence on the run page and the single iMessage alert. Reply `FIX` only after a confirmed failure. A created correction is a proposal until the repository's CI reports that it passes.

## If the external services are slow

- Use the local simulator for the drift reveal. It needs no GitHub, Gemini, Photon, or Confluence key.
- Use `sky:simulate --fill-to 500` only to inspect the map layout. Simulated satellites stay labeled and are excluded from findings.
- If a real scan is queued, leave the browser on the Sky; new satellites arrive through server events as each scan completes.

## Local network boundary

GitHub-hosted Actions cannot reach a server bound only to `127.0.0.1`. For a live remote demo, start an HTTPS tunnel or reverse proxy to `http://localhost:<GROUND_CONTROL_PORT>` and keep it running. Set `PUBLIC_URL` and the Action variable `GROUND_CONTROL_URL` to the tunnel origin, update the GitHub OAuth callback to `<PUBLIC_URL>/auth/github/callback`, then recreate the container. Confirm the public `/healthz` endpoint before a hosted run. Spectrum Cloud iMessage uses an outbound connection from the server; the tunnel is for GitHub and browser access. Azure is optional and is not part of this local setup.
