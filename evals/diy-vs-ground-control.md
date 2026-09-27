# DIY tests vs Ground Control

Status: not run. `GEMINI_API_KEY` is not configured in this workspace, so no model-generated tests or comparison results have been recorded. The Docker Engine and `node:24` image are available. No figures below are estimates.

Run the measured comparison from the Ground Control root after configuring the key:

```sh
bun ops benchmark-diy demo/orbit-app --runs 10
```

The command will replace this status with measured run-by-run results: tests per run, baseline and drift verdict agreement, false alarms on the correct README, explicit README line citations in failures, and generation plus execution time. Every generated test runs inside a disposable `node:24` container with no network, a read-only fixture mount, only `PATH` and `HOME` passed to the test process, and a 60-second execution limit. The generated test's view of `flightchecks/` is empty, so it cannot inspect the committed comparison tests. Ground Control's committed flight checks use the same container profile on the same frozen fixture snapshot.
