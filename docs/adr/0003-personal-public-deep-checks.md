# ADR 0003: deep checks for personal public repositories

Status: accepted for the local prototype after the owner's product update.

## Decision

The public README scanner remains read-only. It fetches documentation and metadata and runs static and optional AI checks without installing dependencies or executing repository code. This applies to visited repositories, bulk Sky scans, and the normal **Check README** button.

A signed-in user may explicitly enable deep checks for a public repository when GitHub reports admin access and the repository owner name matches that user's login. The API returns a one-time, repository-scoped telemetry token. Code runs only after the owner installs the Ground Control workflow in that repository, or selects a local checkout with `--owned`. Private connections continue to receive their token on Connect. A documentation-only public connection gets no token.

The Action validates the event repository and committed flight plan before importing its runner. The sample workflow skips fork PRs and keeps the telemetry token in a separate report job. The server accepts public CI telemetry only when runtime opt-in was recorded and the scoped token matches. Generated flightchecks are published only for runtime-enabled connections; the writer rechecks current GitHub visibility. Private-to-public visibility changes still fail closed until historical private state is resolved.

## Data and UI

`RepoRecord.runtimeEnabled` is optional so existing SQLite records and Rebecca's public snapshot remain readable. `RunRecord.origin` distinguishes new public scanner results from CI results; older stored runs display as earlier runs. The Sky continues to plot public scanner measurements and shows a separate deep CI status for an opted-in personal public repo. The account and Sky explain the static, AI, and deep tiers. Enabling deep checks again rotates the one-time token, so the Actions secret must be updated.

The reviewed `snapshots/sky-snapshot.json` from Rebecca's branch carries measured public scans, runs, sources, and trust states without secrets or connection state. `bun ops sky:load` imports it while preserving existing connections, private records, and newer local scans.
