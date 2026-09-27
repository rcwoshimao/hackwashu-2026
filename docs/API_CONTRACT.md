# Local API contract

The API serves the web app and extension from `http://localhost:8787` in Docker. JSON fields below are stable through the local build. Private repo routes return 401 without a signed-in GitHub session and 403 when that user cannot read the connected repo.

## Read routes

- `GET /healthz` returns plain `ok`.
- `GET /api/sky` returns `{ mode, updatedAt, satellites, findings }`. `mode` is `live`, `cached`, or `simulated`. Each satellite has `{ repo, stars, topicCluster, readmeLagDays, label, driftDegrees, commitSha, scannedAt, tiersRun, simulated }`; findings has `{ realCount, driftingCount, medianLagDays }`. Simulated entries never contribute to findings.
- `GET /api/repos/:owner/:name` returns `{ repo, visibility, label, driftDegrees, latestRunId, sources, runs }`. Sources have `{ id, kind, title, url, claimCount }`; runs have `{ id, commitSha, createdAt, verdict, failingCount }`.
- `GET /api/runs/:id` returns `{ id, repo, commitSha, createdAt, verdict, results, evidence }`. A result has `{ claimId, state, status, quote, sourceId, expected, actual }`. Evidence groups facts by kind and canonical parameters.
- `GET /api/page-claims?url=<encoded>` returns `{ known, canCheck, repo?, claims }`. A claim has `{ id, quote, state, deepLink, tooltip }`; `state` is `verified`, `drifting`, `unconfirmed`, or `disputed`. Unknown pages return `claims: []`.
- `GET /api/me` returns `{ signedIn, login?, connectedRepos }`.
- `GET /api/events` streams changes with Server-Sent Events.

## Write routes

- `POST /api/scan` with `{ repo }` starts a static and optional AI check of a public default branch. It never installs dependencies, runs package scripts or tests, or executes that repository's code. Anonymous callers are limited to five checks per hour per IP. A cached commit returns its existing result.
- `POST /api/connect` with `{ repo }` registers a repo the signed-in user can administer; it never fetches a private repo without this action. Its 201 response includes `repo`, `visibility`, and `sourceDiscovery`. A private connection also receives a one-time `telemetryToken`. A public connection has no `telemetryToken`, clears any previously issued token hash, can sync documentation sources, and receives no generated flightcheck commits. If a stored private repo is now public on GitHub, the route returns 409 `repository_visibility_changed`, keeps historical data marked private, and invalidates its old token. Read routes deny stored private results when GitHub now reports the repo as public. Runtime checks require a connected private repo in its own CI or an explicit local checkout.
- `POST /api/imessage/link` with `{ phone }` requires a signed-in GitHub session and an E.164 phone number. It sends a one-use iMessage linking code to that phone and returns `{ status: "sent" }`. The code is never returned to the browser. The recipient confirms by replying `LINK <code>` in the same conversation. The route is rate limited and returns 503 when messaging is not configured.
- `POST /api/sources` with `{ repo, kind, url }` adds a page to an already connected repo after access is checked.
- `POST /api/runs/:id/claims/:claimId/confirm` and `/drop` require access to the connected repo.
- `POST /api/telemetry` accepts a connected private repo's scoped token and run results from CI; the runner job itself has no secret. The sample workflow checks GitHub's private-repo flag before checkout or dependency installation, and the Action checks it again before importing the checkout runner. Same-repo PR reports verify the head commit and PR number; fork PR reports are skipped. The server requires `GITHUB_WRITE_TOKEN` to resolve the actual commit author's GitHub login before routing an iMessage and never trusts the PR opener or telemetry's `authorLogin` as a substitute.

The extension sends only the normalized URL to `page-claims`; it never uploads page text. Every public repository stays on static and optional AI checks, including a public repo submitted by a user or connected for documentation. The Sky has no runtime tier.
