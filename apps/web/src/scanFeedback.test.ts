import { strict as assert } from "node:assert";
import { test } from "node:test";
import { copy } from "@ground-control/copy";
import { scanErrorMessage, scanFailedFor } from "./scanFeedback.ts";

test("missing README response names the required default-branch file", () => {
  assert.equal(
    scanErrorMessage(
      { code: "server", status: 400, reason: "no_markdown_readme" },
      copy.repoScanFailed,
    ),
    copy.scanNoReadme,
  );
});

test("queued failure only changes the matching repository's feedback", () => {
  const event = JSON.stringify({ repo: "other/project", requestId: "new" });
  assert.equal(scanFailedFor(event, "old"), false);
  assert.equal(scanFailedFor(event, "new"), true);
  assert.equal(scanFailedFor("not json", "new"), false);
});
