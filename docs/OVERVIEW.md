# Ground Control: what it is and how it fits together

As of 2026-09-26.

## Purpose

Ground Control checks whether a project's README still tells the truth about its code.

READMEs go stale. A README says "run `npm start` on port 3000" or "set `API_KEY`", then the code changes and nobody updates the docs. New contributors follow the old instructions and get stuck.

Ground Control reads a README, pulls out the concrete claims it makes (commands, ports, file paths, environment variables), and checks each one against the code. When a claim no longer matches, we call that **drift**.

The app has three jobs:

1. **The Sky:** a map of public JavaScript and TypeScript repos, showing which ones have drifting docs.
2. **Checks for your own repos:** connect a repo you own and Ground Control keeps checking it in GitHub Actions.
3. **Alerts:** when a connected repo drifts, you get an iMessage and can reply to act on it. This is where the photon branch comes in.

## How the app works

There are two ways to use Ground Control. Anyone can look at public repos. Repo owners can go further and connect their own.

### Anyone: look at public repos (the Sky)

- Purpose: a visual demo of what our app can do, just for looking fancy.
- The home page is **the Sky**, a round map of about 100 sample public repos. Each dot is one repo.
- The farther a dot is from the centre, the longer the README has gone without keeping up with the code. Amber dots have drift.
- Click a dot to see what was checked and which README claims failed.
- Type any public `owner/repo` into **Check a public README** to scan it.
- Public scans only *read* the docs and metadata. They never install or run the repo's code.

### Repo owners: connect a repo you own

- Purpose: the main chunk. Where the tests actually lie.
1. Sign in with GitHub and open **My repos**.
2. Choose **Connect** on a repo.
3. Ground Control writes a set of small tests ("flight checks") from the README's claims.
4. Those tests run in the repo's own GitHub Actions on every push, and report back.
5. If a claim breaks, Ground Control marks it as drift.
6. If you've linked your phone, you get an iMessage. Reply `FIX`, `KEEP` or `IGNORE` to deal with it.

### The three levels of checks

| Level | What it does | Runs repo code? |
| --- | --- | --- |
| Static | Reads the README and repo files, checks paths and scripts exist | No |
| AI | Uses Gemini (or Claude) to pull claims out of messy prose | No |
| Deep | Actually runs the commands in the repo's own CI | Yes, only for connected repos |

## Architecture

Everything runs in one Docker container: a web page in front, and one server behind it that does the work.

```
                         +------------------------------------------------------+
                         |  API server  (apps/api, one Docker container)        |
+------------------+     |                                                      |
| Web app          |     |  +------------------------+  +---------------------+ |
| apps/web (React) |---->|  | Store                  |  | Claims and flight   | |
| The Sky, My      |calls|  | packages/store         |  | checks              | |
| repos, reports   |     |  | SQLite: scans, runs,   |  | packages/claims,    | |
+------------------+     |  | phone links, alerts    |  | plan                | |
                         |  +------------------------+  | README -> claims    | |
+------------------+     |                              | -> tests            | |
| GitHub Actions   |     |  +------------------------+  +---------------------+ |
| in a connected   |---->|  | Scanner                |  +---------------------+ |
| repo: runs the   |sends|  | packages/scanner       |  | Messaging  (PHOTON) | |
| flight checks    |     |  | fetches public repos,  |  | packages/messaging  | |
+------------------+     |  | static + AI checks     |  | iMessage alerts     | |
                         |  +-----------+------------+  +----------+----------+ |
                         +--------------|--------------------------|------------+
                                        v                          ^
                               +-----------------+        +-----------------+
                               | GitHub, Gemini  |        | Your phone      |
                               | repo data, AI   |        | reply FIX, KEEP |
                               +-----------------+        | or IGNORE       |
                                                          +-----------------+
```

The browser only talks to the API server. Connected repos run their own checks in GitHub Actions and send the results back. When the results show drift, Messaging texts the owner.

The code is split into small packages under `packages/`. You only need to know the four above to follow the app. The rest are helpers: sign-in (`auth`), the AI calls (`ai`), all user-facing text (`copy`), and suggested fixes (`fixes`).

One rule to know: every outside service (GitHub, Gemini, Photon) sits behind an interface with a real version and a fake one. Tests use the fakes, so they never need the internet or a secret key.

## Where the photon branch fits

The photon branch is the **Messaging** box in the diagram above: it uses Photon's Spectrum library to send iMessages, which is how drift alerts reach your phone. Its PR-event texts would become a new alert type inside `packages/messaging`.

## Words and where to start

| Word | Meaning |
| --- | --- |
| Claim | One concrete statement in a README, like "runs on port 3000" |
| Drift | A claim that no longer matches the code |
| Flight checks | Small tests generated from claims, run in the repo's CI |
| The Sky | The map of public repos on the home page |
| Connect | Opting your own repo into flight checks and alerts |
| Spectrum | Photon's library for sending iMessages from code |

**To get started with messaging:**

1. Check out the `hussein` branch and run the app with Docker (see `README-START-HERE.md`).
2. Read `packages/messaging/src/hub.ts`. It receives each incoming text and decides what to do.
3. Read `packages/messaging/src/alerts.ts`. It builds and sends the drift alert.
4. Put your Photon keys in `.env` as `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET`, then link your phone from the Connect page.
