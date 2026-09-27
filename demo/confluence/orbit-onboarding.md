# Orbit App onboarding

Use Node.js 24 or newer. Install dependencies with `npm install`, then start the demo with `npm run dev`. It listens on port 3000 by default.

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` to set `PORT` and `ORBIT_GREETING`. The `PORT` variable changes the server port; `ORBIT_GREETING` changes the home-page text.

The health check is `GET http://localhost:3000/api/health`. Run `npm test` before making a pull request.
