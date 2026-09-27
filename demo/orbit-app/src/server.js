import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import { listPlanets } from "./catalog.js";

export function createApp() {
  const app = express();
  const greeting = process.env.ORBIT_GREETING ?? "Welcome aboard";
  app.get("/", (_request, response) => response.status(200).send(greeting));
  app.get("/api/health", (_request, response) =>
    response.json({ status: "ok", version: "1.0.0" }),
  );
  app.get("/api/planets", (_request, response) =>
    response.json({ planets: listPlanets() }),
  );
  return app;
}

const port = Number(process.env.PORT ?? "3000");
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  createApp().listen(port, (error) => {
    if (error) {
      process.stderr.write(
        `unable to listen on port ${port}: ${error.message}\n`,
      );
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`listening on ${port}\n`);
  });
}
