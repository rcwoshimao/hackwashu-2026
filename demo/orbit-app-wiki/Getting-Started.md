# Getting Started

Orbit App needs Node.js 24 or newer. Run `npm install`, then `npm run dev` to start the server on port 3000.

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` to set `PORT` and `ORBIT_GREETING`. `PORT` changes the listening port; `ORBIT_GREETING` changes the home-page text.

The health endpoint is `GET http://localhost:3000/api/health`. Run `npm test` before you send a change.
