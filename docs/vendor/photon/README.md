# Photon Spectrum: vendored reference

Downloaded from Photon's published packages and repository for `spectrum-ts` **12.10.1** (latest on npm when this folder was made). Pin that version, or update this folder when you upgrade.

## What's here
- `pages/`: Photon's documentation page sources (Mintlify `.mdx` templates from the `photon-hq/spectrum-ts` repo). Some contain template placeholders such as `symbol("ts:...")`; the real signatures are in `types/`.
- `types/`: the TypeScript declaration files from the published packages (`spectrum-ts`, `@spectrum-ts/core`, `@spectrum-ts/imessage`, `@spectrum-ts/telegram`, `@spectrum-ts/hono`, `@spectrum-ts/terminal`). File names replace `/` with `_`.
- `packages/`: each package's README, plus the repository README.

## Facts Ground Control depends on (verified against these files)
1. **Current provider:** `import { Spectrum } from "spectrum-ts"` and `import { imessage } from "spectrum-ts/providers/imessage"`. Ground Control uses the cloud provider with `"imessage"` as its platform ID; the separate macOS provider has `"local_imessage"` and is not part of the Docker deployment (`pages/providers_imessage.mdx`).
2. **Cloud config:** `Spectrum({ projectId, projectSecret, providers: [imessage.config()] })` discovers the project's managed iMessage lines and renews their tokens. The Docker server supplies `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET` (`pages/providers_imessage.mdx`).
3. **Inbound:** cloud iMessage connects to managed infrastructure through gRPC. Messages arrive on `for await (const [space, message] of app.messages)`; filter `message.platform === "imessage"` and narrow with `imessage(message)` for sender details (`pages/providers_imessage_connection-and-routing.mdx`).
4. **Outbound:** resolve a phone user with `const im = imessage(app); const user = await im.user("+15551111111")`, create a DM with `await im.space.create(user)`, then call `space.send(text)`. Existing conversations can be retrieved with `im.space.get(chatGuid)` subject to the line-routing rules in `pages/providers_imessage_connection-and-routing.mdx`.
5. **Line model:** Free and Pro use a shared pool; Business can use dedicated lines. Direct messages work with either. Provision a line in the project before testing a live phone exchange (`pages/providers_imessage_connection-and-routing.mdx`).
6. **Legacy Telegram material:** `providers_telegram*.mdx` and related declarations remain vendored for reference, but they do not govern the current adapter.

Read `pages/best-practices__inbound-pipeline.mdx` and `pages/best-practices__recovery-and-state.mdx` before writing the messaging package.
