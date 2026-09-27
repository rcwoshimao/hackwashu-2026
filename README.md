# Ground Control

Ground Control checks whether repository documentation still agrees with the code. The Sky tracks public JavaScript and TypeScript repositories using static and AI checks. A repository you own can also run deeper flight checks in its own GitHub Action or an owner-approved local checkout, whether it is public or private. Visiting or requesting a normal public scan never executes repository code.

## Run with Docker Desktop

1. Start Docker Desktop.
2. Copy `.env.example` to `.env`. This workspace's ignored `.env` already exists and uses host port **8877** because 8787 is occupied here. Add your keys there when you are ready.
3. From this directory, run `docker compose up --build -d`.
4. Open `http://localhost:8877` in this workspace, or `http://localhost:8787` when using the example's default port. `docker compose ps` should show a healthy container; `/healthz` returns `ok`.

With no keys or scans, the Sky starts empty and reports zero measured findings. You can still check an individual public repo through the web app, subject to GitHub's anonymous API limit; the result is a real static scan saved by commit. Add `GITHUB_SCAN_TOKEN` and `GEMINI_API_KEY` to `.env`, then run `docker compose up -d` to enable a larger real scan and AI extraction. For example:

```sh
docker compose exec groundcontrol bun ops sky:scan --top 20 --tiers static,ai
docker compose exec groundcontrol bun ops sky:scan --top 500 --tiers static,ai
```

The first command is a useful key check before starting all 500. `bun ops sky:simulate --fill-to 500` adds labeled layout filler only for an explicit demo; the normal Sky hides it. The server stores scan results in a Docker volume and serves the web app from the same container.

Rebecca's branch includes a checked-in snapshot of 51 measured public scans. Load it into the local database without replacing newer local results or connections:

```sh
docker compose exec -T groundcontrol bun ops sky:load snapshots/sky-snapshot.json
```

After signing in with GitHub, open **My repos**. Ground Control lists up to 500 recently updated repositories your OAuth account can access, including private repositories, without scanning or connecting them. Search or filter the list, browse 12 at a time, choose **Check README** on one public repository, or choose **Scan all public READMEs**. The signed-in Sky shows unscanned account repositories in a separate holding orbit, with scope and scan-state filters, quick search, and a 20-row list. Scanned public repos use measured positions; saved CI results appear as checked marks. The Sky explains the static, AI, and deep tiers. For a private repo, choose **Connect** to opt in to CI checks. For a public repo owned by your signed-in account, choose **Enable deep checks** to receive Actions setup. Private repositories are never included in the public bulk scan.

## Test the drift loop locally

After the container is running, use `docker compose exec -T groundcontrol bun ops fly` for the keyless drift rehearsal. This explicit command copies Ground Control's bundled `demo/orbit-app` fixture to a disposable checkout, runs its flight checks, applies a one-line port change, and reports the resulting drift. It never fetches a public repository to execute. It chooses an available loopback port in the copy so another host service cannot affect the result. The original demo files are untouched. To run it on the host instead, install Bun and Node.js, run `bun install` in this repository, and run `npm ci` in `demo/orbit-app` if its `node_modules` directory is absent. Then run `bun ops fly` from the repository root.

Use `bun run check` for TypeScript, lint, unit tests, copy checks, and golden tests. See [SELF_HOST.md](docs/SELF_HOST.md) for keys, private repositories, the extension, and troubleshooting.

For an owner-selected checkout, `bun run gc scan --owned <checkout>` generates and runs its flight checks; `bun run gc check --owned <checkout>` reruns the saved plan. The commands work without a Git repository. `--owned` records your explicit choice to execute that local checkout; it does not look up GitHub visibility. The earlier `--private` flag still works. This CLI is available from this workspace and has not been published to npm. See [HUSSEIN_HANDOFF.md](docs/HUSSEIN_HANDOFF.md) for the engine and teammate integration contract.

## Connect a repository to CI

Open the [hosted Ground Control app](https://ground-control-washu26.azurewebsites.net), sign in with GitHub, and choose **Connect** on a private repo or **Enable deep checks** on a public repo you own. Ground Control publishes the generated `flightchecks/` files when its GitHub write token has Contents permission. Review those files in your repository.

Copy the one-time telemetry token and run the displayed `gh secret set GROUND_CONTROL_TOKEN -R <owner/repo>` command. GitHub CLI prompts for the token, so the command does not contain it. Download the short workflow with the Azure HTTPS URL already filled in and add it to the target repo at `.github/workflows/ground-control.yml`. It calls this repository's [reusable workflow](.github/workflows/ground-control-reusable.yml), which runs checks in a secret-free job and sends the report separately. Open a same-repo PR to establish a baseline. [SELF_HOST.md](docs/SELF_HOST.md) has the full setup and optional local fallback.
## Link iMessage for drift alerts

Create a Photon Spectrum project with a cloud iMessage line, then set `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET` in the ignored `.env` and recreate the container. Sign in with GitHub, open **Connect a repo**, enter your iMessage phone number in international `+` format, and choose **Send linking message**. Reply to the one-time `LINK` code in the received iMessage. Confirmed drift from your connected repositories can then reach your phone as one grouped alert; reply `FIX`, `KEEP`, or `IGNORE` to act on it. A Mac is not required for the cloud provider. With no Spectrum credentials, the web app and keyless drift rehearsal still run; the linking form reports that messaging is unavailable.

## Safety and scope

- Ordinary public scans never install dependencies, run package scripts, run generated tests, or execute repository code. This stays true for visited repositories and public README buttons.
- Deep checks require an explicit connection and Actions setup for private repos, or an explicit personal-repo opt-in for public repos. The code runs in the repo's own job without the telemetry secret, or in an owner-approved local checkout. The bundled Orbit fixture has a separate explicit rehearsal command.
- Source text sent through the AI tier goes to Gemini. A self-hosted company can leave `GEMINI_API_KEY` unset and use only local static checks.
- The normal Sky shows actual saved scans and signed-in account inventory. Demo marks require an explicit `?demo=1` API request and never count toward findings. Every real result records its commit SHA and tiers run.

The server deploys automatically from `main` to Azure App Service. The hosted address and deployment details are in [SELF_HOST.md](docs/SELF_HOST.md).

Brainstorm document: https://docs.google.com/document/d/1Tvvr4aTonTk0JwStcXxoIpkWb_T_BNyADP1SHW2quwo/edit?usp=sharing
