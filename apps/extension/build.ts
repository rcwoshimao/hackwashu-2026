import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extensionCopy } from "@ground-control/copy";
import { build } from "vite";
import { resolvePublicUrl } from "./src/buildConfig.ts";

const root = resolve(import.meta.dir);
const localEnv = await readFile(resolve(root, "../../.env"), "utf8").catch(
  () => "",
);
const publicUrl = resolvePublicUrl(localEnv, process.env);
const serverPattern = `${publicUrl.protocol}//${publicUrl.hostname}/*`;
const define = { __GC_PUBLIC_URL__: JSON.stringify(publicUrl.origin) };

await build({
  root,
  base: "./",
  configFile: false,
  define,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: resolve(root, "popup.html") },
  },
});
for (const [entry, fileName, format] of [
  ["background", "background.js", "es"],
  ["content", "content.js", "iife"],
] as const) {
  await build({
    root,
    configFile: false,
    define,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
        entry: resolve(root, `src/${entry}.ts`),
        name: `GroundControl${entry}`,
        formats: [format],
        fileName: () => fileName,
      },
    },
  });
}

const manifest = {
  manifest_version: 3,
  name: extensionCopy.extensionTitle,
  description: extensionCopy.extensionSubtitle,
  version: "0.1.0",
  permissions: ["storage", "identity", "activeTab", "scripting"],
  host_permissions: [
    "https://github.com/*",
    "https://*.atlassian.net/*",
    serverPattern,
  ],
  optional_host_permissions: ["https://*/*"],
  action: {
    default_popup: "popup.html",
    default_title: extensionCopy.extensionTitle,
  },
  background: { service_worker: "background.js", type: "module" },
  content_scripts: [
    {
      matches: ["https://github.com/*", "https://*.atlassian.net/*"],
      css: ["claims.css"],
      js: ["content.js"],
      run_at: "document_idle",
    },
  ],
};
await mkdir(resolve(root, "dist"), { recursive: true });
await copyFile(
  resolve(root, "src/claims.css"),
  resolve(root, "dist/claims.css"),
);
await writeFile(
  resolve(root, "dist/manifest.json"),
  JSON.stringify(manifest, null, 2),
);
