# Ground Control

Ground Control checks whether repository documentation still agrees with the code. An explicitly connected private repository can run deterministic flight checks in its own CI. The local web app shows those results, and the Sky tracks public JavaScript and TypeScript repositories using static and AI checks. Ground Control never executes code from a public repository, including one that someone visits or submits for a scan.

## Run with Docker Desktop

1. Start Docker Desktop.
2. Copy `.env.example` to `.env`. This workspace's ignored `.env` already exists and uses host port **8877** because 8787 is occupied here. Add your keys there when you are ready.
3. From this directory, run `docker compose up --build -d`.
4. Open `http://localhost:8877` in this workspace, or `http://localhost:8787` when using the example's default port. `docker compose ps` should show a healthy container; `/healthz` returns `ok`.

With no keys, the Sky starts with three clearly simulated satellites and zero measured findings. You can still check an individual public repo through the web app, subject to GitHub's anonymous API limit; the result is a real static scan saved by commit. Add `GITHUB_SCAN_TOKEN` and `GEMINI_API_KEY` to `.env`, then run `docker compose up -d` to enable a larger real scan and AI extraction. For example:

```sh
docker compose exec groundcontrol bun ops sky:scan --top 20 --tiers static,ai
docker compose exec groundcontrol bun ops sky:scan --top 500 --tiers static,ai
```

The first command is a useful key check before starting all 500. `bun ops sky:simulate --fill-to 500` adds visibly simulated layout filler; simulated records never count toward findings. The server stores scan results in a Docker volume and serves the web app from the same container.

After signing in with GitHub, open **My repos**. Ground Control lists up to 500 recently updated repositories your OAuth account can access, including private repositories, without scanning or connecting them. Search the list, choose **Check README** on one public repository, or choose **Scan all public READMEs** to request checks for the eligible public repositories shown. The scan results are saved and join the Sky. For a private repository you administer, choose **Connect** to get the one-time Actions token and opt in to runtime checks. Private repositories are never included in the public bulk scan. The header shows your GitHub login while signed in.

## Test the drift loop locally

After the container is running, use `docker compose exec -T groundcontrol bun ops fly` for the keyless drift rehearsal. This explicit command copies Ground Control's bundled `demo/orbit-app` fixture to a disposable checkout, runs its flight checks, applies a one-line port change, and reports the resulting drift. It never fetches a public repository to execute. It chooses an available loopback port in the copy so another host service cannot affect the result. The original demo files are untouched. To run it on the host instead, install Bun and Node.js, run `bun install` in this repository, and run `npm ci` in `demo/orbit-app` if its `node_modules` directory is absent. Then run `bun ops fly` from the repository root.

Use `bun run check` for TypeScript, lint, unit tests, copy checks, and golden tests. See [SELF_HOST.md](docs/SELF_HOST.md) for keys, private repositories, the extension, and troubleshooting.

For an owner-selected private checkout, `bun run gc scan --private <checkout>` generates and runs its flight checks; `bun run gc check --private <checkout>` reruns the saved plan. The commands work without a Git repository. `--private` records your explicit choice to execute that local checkout; it does not look up GitHub visibility. This CLI is available from this workspace and has not been published to npm. See [HUSSEIN_HANDOFF.md](docs/HUSSEIN_HANDOFF.md) for the engine and teammate integration contract.

## Connect a repository to CI

Sign in through the web app, open **My repos**, and choose **Connect** on a **private repository you administer**. Save the one-time telemetry token shown there as that repository's Actions secret `GROUND_CONTROL_TOKEN`. From the Ground Control root, generate the first committed flight checks against a separate checkout of that private repository:

```sh
bun ops seed-plan <checkout> <owner/repo>
```

Review and commit the three generated files in `<checkout>/flightchecks/` before enabling the [sample two-job workflow](demo/orbit-app/.github/workflows/ground-control.yml). On your own private checkout, you may explicitly install its dependencies and run `node --test flightchecks` after reviewing the plan. The workflow checks GitHub's private-repository flag before checkout, dependency installation, or tests. Replace its `YOUR_GITHUB_USER` Action reference with a published, accessible copy of this repository. GitHub-hosted Actions need an HTTPS tunnel to this local Docker server; use that origin for `PUBLIC_URL`, the OAuth callback, and the repository Actions variable `GROUND_CONTROL_URL`. With a `GITHUB_WRITE_TOKEN` that has Contents write access, default-branch source changes schedule a flightchecks commit. Verify that commit before relying on it; if publication fails or a PR branch changes documentation, run `seed-plan` against that branch, review the generated files, and commit them there. Report mode checks the repository, commit SHA, and PR number against the workflow context. Treat its status as advisory for branches whose authors can edit the runner until trusted attestation is added. Private GitHub wiki sync is unavailable. [SELF_HOST.md](docs/SELF_HOST.md) has the full sequence.

To use Claude for connected-source and local seed/scan claim extraction, set `EXTRACTION_MODEL=claude` and `ANTHROPIC_API_KEY` in `.env`. Gemini remains the default AI path and the public Sky continues to use Gemini or static checks. Without either model key, local heuristic extraction works.

## Link iMessage for drift alerts

Create a Photon Spectrum project with a cloud iMessage line, then set `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET` in the ignored `.env` and recreate the container. Sign in with GitHub, open **Connect a repo**, enter your iMessage phone number in international `+` format, and choose **Send linking message**. Reply to the one-time `LINK` code in the received iMessage. Confirmed drift from your connected repositories can then reach your phone as one grouped alert; reply `FIX`, `KEEP`, or `IGNORE` to act on it. A Mac is not required for the cloud provider. With no Spectrum credentials, the web app and keyless drift rehearsal still run; the linking form reports that messaging is unavailable.

## Safety and scope

- Every public repository receives static and optional AI checks only. A connected public repo can sync documentation sources but receives no Actions token or generated flightcheck commits. Public scans never install dependencies, run package scripts, run generated tests, or execute repository code, even if a user submits a URL or connects the repo.
- Runtime checks require an explicitly connected private repository. They run in its secret-free GitHub Actions job or when its owner opts in from a local checkout. The bundled Orbit fixture has a separate explicit rehearsal command.
- Source text sent through the AI tier goes to Gemini. A self-hosted company can leave `GEMINI_API_KEY` unset and use only local static checks.
- The initial Sky data is labeled simulated until you run a real scan. Every real result records its commit SHA and tiers run.

Azure deployment is intentionally deferred.
