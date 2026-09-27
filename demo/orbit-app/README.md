# Orbit App

Orbit App is a small Node.js 24 demo server and command-line tool.

## Install

The project requires Node.js 24 or newer (`>=24`). The committed `package-lock.json` keeps installs reproducible.

Copy `.env.example` to `.env` if you want to set a local port or greeting. The man page is `man/orbit.1`.

```sh
npm install
cp .env.example .env
```

## Run the server

The `dev` script starts the server, and the `start` script runs the same entry point. The code exports `createApp` from `src/server.js` and `listPlanets` from `src/catalog.js`.

```sh
npm run dev
```

The server listens on port 3000 by default. `PORT` can override the default, and `ORBIT_GREETING` changes the home-page text.

```sh
node src/server.js
```

Open `http://localhost:3000/` after the server starts. `GET /api/health` returns status 200 with JSON keys `status` and `version`; `GET /api/planets` returns status 200 with a `planets` key.

## Check the app

The `test` script runs Node's built-in tests. This command should exit successfully:

```sh
npm test
```

## Use the CLI

The `orbit` CLI supports the `--format` flag with `json` and `table` values. Its help text documents that flag.

```sh
node bin/orbit.js --format json
```
