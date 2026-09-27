import express from "express";
import { Spectrum } from "spectrum-ts";
import { imessage } from "@spectrum-ts/imessage";

// ---- 1. Set up Spectrum + iMessage --------------------------------------

const app = await Spectrum({
  projectId: process.env.PROJECT_ID!,
  projectSecret: process.env.PROJECT_SECRET!,
  providers: [imessage.config()],
});

const im = imessage(app);

// Your own phone number, in E.164 format (e.g. "+15551234567").
// Set this in .env as MY_PHONE_NUMBER.
const MY_PHONE_NUMBER = process.env.MY_PHONE_NUMBER!;
if (!MY_PHONE_NUMBER) {
  throw new Error("Set MY_PHONE_NUMBER in your .env file, e.g. +15551234567");
}

const me = await im.user(MY_PHONE_NUMBER);
const myDM = await im.space.create(me);

async function textMe(body: string) {
  await myDM.send(body);
}

// ---- 2. Keep the existing echo loop running in the background ----------

(async () => {
  for await (const [space, message] of app.messages) {
    if (message.content.type === "text") {
      await space.send(`echo: ${message.content.text}`);
    }
  }
})();

// ---- 3. GitHub webhook -> text me on PR events --------------------------

const server = express();
server.use(express.json());

server.post("/github-webhook", async (req, res) => {
  const event = req.header("x-github-event");
  const { action, pull_request, repository } = req.body ?? {};

  // We only care about pull_request events.
  if (event === "pull_request" && pull_request) {
    const repo = repository?.full_name ?? "unknown repo";
    const title = pull_request.title ?? "(no title)";
    const number = pull_request.number;
    const url = pull_request.html_url;
    const author = pull_request.user?.login ?? "someone";

    let summary: string;
    switch (action) {
      case "opened":
        summary = `New PR #${number} in ${repo} by ${author}: "${title}"\n${url}`;
        break;
      case "closed":
        summary = pull_request.merged
          ? `PR #${number} merged in ${repo}: "${title}"\n${url}`
          : `PR #${number} closed (not merged) in ${repo}: "${title}"\n${url}`;
        break;
      case "reopened":
        summary = `PR #${number} reopened in ${repo}: "${title}"\n${url}`;
        break;
      default:
        summary = `PR #${number} ${action} in ${repo}: "${title}"\n${url}`;
    }

    try {
      await textMe(summary);
    } catch (err) {
      console.error("Failed to send iMessage:", err);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log(`GitHub webhook listener running on http://localhost:${PORT}/github-webhook`);
  console.log("Spectrum iMessage bot is running. Waiting for messages...");
});
