# Start Ground Control locally

Ground Control is ready to run with Docker Desktop. Follow the [README](README.md) for the quick start, the keyless drift rehearsal, and the public Sky scan. Use [SELF_HOST.md](docs/SELF_HOST.md) for connected repositories, the Chrome extension, and troubleshooting. The exact account and key steps are in [HUMAN_SETUP.md](docs/HUMAN_SETUP.md).

Copy `.env.example` to the ignored `.env`, start Docker Desktop, and run `docker compose up --build -d`. This shared workspace uses `GROUND_CONTROL_PORT=8877`; the example defaults to 8787. Open the matching `http://localhost:<port>` and run `docker compose exec -T groundcontrol bun ops fly` for a drift demonstration that needs no external keys.

To test phone alerts, provision a **Spectrum Cloud iMessage line** and add `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET` to `.env`. GitHub sign-in also needs a GitHub OAuth app and `SESSION_SECRET`. Then use the Connect page to send a one-time linking message to your iMessage phone and reply with its `LINK` code. The cloud provider runs in Docker without a Mac. Live delivery needs those credentials and the provisioned line.
