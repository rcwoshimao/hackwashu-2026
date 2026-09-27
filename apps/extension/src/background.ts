import { api } from "./api.ts";
import { handlePageMessage, isPageRequest } from "./pageMessage.ts";

chrome.runtime.onMessage.addListener((value: unknown, sender, sendResponse) => {
  if (!isPageRequest(value)) return false;
  void handlePageMessage(
    value,
    sender.url ?? sender.tab?.url,
    api.pageClaims,
  ).then(sendResponse);
  return true;
});
