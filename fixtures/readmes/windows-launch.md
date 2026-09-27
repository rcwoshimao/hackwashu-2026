# Windows Launch

Node 22 or newer is required. The `launchControl()` API uses `GROUND_CONTROL_HOME`.

```powershell
cp .env.example .env
npm run start
```

Open http://localhost:5050/ to check the service. `POST /api/launch` returns its status.
