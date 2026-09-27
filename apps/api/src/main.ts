import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ClaudeModel,
  GeminiModel,
  HeuristicModel,
  SqliteModelCache,
} from "@ground-control/ai";
import { AuthService, GitHubHttp, Sessions } from "@ground-control/auth";
import { OctokitPrComments } from "@ground-control/fixes";
import {
  OctokitPlanWriter,
  publishFlightPlan,
} from "@ground-control/publisher";
import { OctokitPublicGitHub, PublicScanner } from "@ground-control/scanner";
import {
  OctokitRepositoryFiles,
  PinnedWebPage,
  SourceSync,
} from "@ground-control/source-sync";
import { ConfluenceCloud } from "@ground-control/sources";
import { SqliteStore } from "@ground-control/store";
import { planPublishDebounceMs } from "../../../config/limits.ts";
import { OctokitCommitAuthor } from "./commit-author.ts";
import {
  createApi,
  EventHub,
  GitHubCommitStatus,
  seedLocalDemo,
} from "./index.ts";
import { startMessaging } from "./messaging.ts";
import { FlightPlanPublishQueue } from "./publish-schedule.ts";

const dbPath = process.env.DATABASE_PATH || "data/groundcontrol.db";
mkdirSync(dirname(dbPath), { recursive: true });
const store = new SqliteStore(dbPath);
seedLocalDemo(store, new Date());
const publicUrl = (process.env.PUBLIC_URL || "http://localhost:8787").replace(
  /\/$/,
  "",
);
const github = new GitHubHttp(
  process.env.GITHUB_CLIENT_ID || "",
  process.env.GITHUB_CLIENT_SECRET || "",
);
const secret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const sessions = new Sessions(store, secret, Date.now);
const auth = new AuthService(
  github,
  sessions,
  publicUrl,
  Date.now,
  process.env.EXTENSION_ID,
);
const events = new EventHub();
const planWriter = process.env.GITHUB_WRITE_TOKEN
  ? new OctokitPlanWriter(process.env.GITHUB_WRITE_TOKEN)
  : null;
const publishQueue = planWriter
  ? new FlightPlanPublishQueue(
      async (repo) => {
        const result = await publishFlightPlan(store, repo, planWriter);
        const kind = result.ok
          ? "flightplan_published"
          : "flightplan_publish_failed";
        const payload = result.ok ? result.value : result.error;
        const event = store.appendEvent(kind, new Date().toISOString(), {
          repo,
          ...payload,
        });
        events.publish(event);
      },
      (repo) => {
        const event = store.appendEvent(
          "flightplan_publish_failed",
          new Date().toISOString(),
          { repo },
        );
        events.publish(event);
      },
      planPublishDebounceMs,
    )
  : null;
const publicModel = process.env.GEMINI_API_KEY
  ? new GeminiModel(process.env.GEMINI_API_KEY)
  : new HeuristicModel();
if (process.env.EXTRACTION_MODEL === "claude" && !process.env.ANTHROPIC_API_KEY)
  throw new Error("anthropic_api_key_required_for_claude");
const connectedModel =
  process.env.EXTRACTION_MODEL === "claude"
    ? new ClaudeModel(process.env.ANTHROPIC_API_KEY ?? "")
    : publicModel;
const modelCache = new SqliteModelCache(dbPath);
const confluence =
  process.env.CONFLUENCE_SITE &&
  process.env.CONFLUENCE_EMAIL &&
  process.env.CONFLUENCE_API_TOKEN
    ? new ConfluenceCloud(
        process.env.CONFLUENCE_SITE,
        process.env.CONFLUENCE_EMAIL,
        process.env.CONFLUENCE_API_TOKEN,
      )
    : null;
const sourceSync = new SourceSync({
  store,
  files: new OctokitRepositoryFiles(process.env.GITHUB_SCAN_TOKEN),
  web: new PinnedWebPage(),
  confluence,
  serviceToken: process.env.GITHUB_WRITE_TOKEN,
  confluenceSite: process.env.CONFLUENCE_SITE,
  model: connectedModel,
  cache: modelCache,
  now: () => new Date(),
  onUpdate: (snapshot, changed) => {
    const event = store.appendEvent(
      "source_refresh",
      new Date().toISOString(),
      {
        sourceId: snapshot.sourceId,
        repo: snapshot.repo,
        status: snapshot.status,
        contentHash: snapshot.contentHash,
        errorCode: snapshot.errorCode,
        changed,
      },
    );
    events.publish(event);
  },
  onPlan: (repo, claimCount) => {
    const event = store.appendEvent("source_plan", new Date().toISOString(), {
      repo,
      claimCount,
    });
    events.publish(event);
    const connectedRepo = store.getRepo(repo);
    if (
      claimCount !== null &&
      connectedRepo?.connected === true &&
      connectedRepo.visibility === "private"
    )
      publishQueue?.schedule(repo);
  },
});
const scanner = new PublicScanner(
  store,
  new OctokitPublicGitHub(process.env.GITHUB_SCAN_TOKEN || undefined),
  publicModel,
  modelCache,
  () => new Date(),
  (event) => events.publish(event),
);
const status = process.env.GITHUB_WRITE_TOKEN
  ? new GitHubCommitStatus(process.env.GITHUB_WRITE_TOKEN, publicUrl)
  : undefined;
const prComments = process.env.GITHUB_WRITE_TOKEN
  ? new OctokitPrComments(process.env.GITHUB_WRITE_TOKEN)
  : undefined;
const commitAuthor = process.env.GITHUB_WRITE_TOKEN
  ? new OctokitCommitAuthor(process.env.GITHUB_WRITE_TOKEN)
  : undefined;
const messaging = await startMessaging({
  dbPath,
  secret,
  publicUrl,
  store,
  events,
  scanner,
  ...(status === undefined ? {} : { status }),
  ...(prComments === undefined ? {} : { prComments }),
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  githubWriteToken: process.env.GITHUB_WRITE_TOKEN,
  confluenceSite: process.env.CONFLUENCE_SITE,
  confluenceEmail: process.env.CONFLUENCE_EMAIL,
  confluenceToken: process.env.CONFLUENCE_API_TOKEN,
});
let server: ReturnType<typeof Bun.serve>;
const app = createApi({
  store,
  auth,
  events,
  scanner,
  sourceSync,
  confluenceSite: process.env.CONFLUENCE_SITE,
  ...(messaging === null ? {} : { messaging }),
  ...(status === undefined ? {} : { status }),
  ...(prComments === undefined ? {} : { prComments }),
  ...(commitAuthor === undefined ? {} : { commitAuthor }),
  now: () => new Date(),
  publicUrl,
  webDist: resolve(process.cwd(), "apps/web/dist"),
  clientIp: (request) => server.requestIP(request)?.address ?? "anonymous",
});

server = Bun.serve({
  port: Number(process.env.PORT || "8787"),
  fetch: app.fetch,
});
const sourceRefreshError = () => {
  const event = store.appendEvent(
    "source_refresh_failed",
    new Date().toISOString(),
    {},
  );
  events.publish(event);
};
sourceSync.start(sourceRefreshError);
void sourceSync.refreshDue().catch(sourceRefreshError);
