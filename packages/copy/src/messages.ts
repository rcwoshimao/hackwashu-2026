export const messageCopy = {
  linkRequest:
    "Ground Control linking code for GitHub @{user}: LINK {token}. Reply with that exact line to confirm this phone for GitHub alerts. Expires in 24 hours.",
  linkWelcome:
    "Linked to GitHub user {user}. You'll only hear from me about commits you make, or when you ask. Reply stop to unlink.",
  linkInvalid:
    "That code has expired or was already used. Request a new linking message from Ground Control.",
  linkRequired: "Link your GitHub account before using this command.",
  stop: "Unlinked. I've deleted this chat's link to your GitHub account.",
  help: "Reply FIX for a tested correction, KEEP if the docs are right, or IGNORE to silence this claim. Reply status, run owner/repo, or stop. Use CONFIRM <claim id> or DROP <claim id> for a disputed check.",
  unknown:
    "I couldn't read that command. Reply help for the available commands.",
  noDrift: "There is no open drift for your linked GitHub account.",
  chooseDrift:
    "Several drifts need a decision. Reply with one number: {choices}",
  choiceInvalid:
    "That number does not match an open drift. Reply with a listed number.",
  driftAlertMulti:
    "Your commit {sha} changed code. {count} {docNoun} {verb} confirmed failing checks: {locations}. Full evidence: {url}. Reply FIX for corrections, KEEP if the docs are right, or IGNORE.",
  fixUnavailable:
    "I can't deliver a verified correction yet. The drift and evidence remain open: {url}",
  fixPartial:
    "I delivered {delivered} source updates and could not deliver {unavailable}. Review the evidence: {url}",
  fixDone:
    "Correction passed all {count} checks. Pull request {pr} is ready for review.",
  fixPending:
    "Draft pull request {pr} is open. Its correction is waiting for the repository's own CI. {extras}",
  fixSuggestions:
    "I prepared {delivered} source updates. {extras} Evidence: {url}",
  fixCiFailed:
    "The draft correction did not pass the repository's CI. Review {pr} and the evidence: {url}",
  fixPrTitle: "Update documented default port from {oldPort} to {newPort}",
  fixPrBody:
    "Source: deep scan in the repository's CI. Ground Control found a confirmed port mismatch. Update only cited wording at {citations} from {oldPort} to {newPort}. The flight plan and generated tests are updated. Review each changed line; this draft awaits the repository's CI.",
  smokePrTitle: "Test Ground Control deep scan",
  smokePrBody:
    "Source: deep scan setup test. This draft contains an empty commit and no file edits. It checks that the repository's Ground Control workflow can run and report results. Close the draft after reviewing the Actions jobs; no merge is needed.",
  deepFixPrTitle: "Review {count} deep scan documentation edit(s)",
  deepFixBasePr:
    "This draft targets the source pull request branch so its diff contains only these documentation edits.",
  deepFixBaseDefault: "This draft targets the repository's default branch.",
  deepFixPrBody:
    "Source: deep scan in the repository's CI at commit {sha}. {base} Ground Control drafted line edits for confirmed findings:\n\n{changes}\n\nReview each changed line in Files changed. This draft is a proposal; the repository's CI determines whether its checks pass. Generated flight checks refresh from the documentation after merge.",
  fixEvidenceOnly:
    "External page evidence is available for {count} source(s) at {url}.",
  fixConfluencePosted:
    "I posted a correction comment on {count} Confluence page(s).",
  prEvidenceLead:
    "Source: deep scan in the repository's CI. Ground Control found {count} confirmed documentation mismatch(es) on commit {sha}.",
  prEvidenceHeading:
    "| Source | Documented claim | Expected | Observed | Evidence |\n| --- | --- | --- | --- | --- |",
  prEvidenceRow:
    "| {source} | {quote} | {expected} | {actual} | [Open evidence]({url}) |",
  prEvidenceFooter:
    "Reply FIX by iMessage to request a correction, or review the cited evidence before changing code or docs.",
  keepDone:
    "Kept the docs as written. The check stays failing until the code matches.",
  ignoreDone:
    "Ignoring this claim until the documented quote changes. The dashboard still shows it.",
  confirmDone: "Confirmed check {id}.",
  confirmDrift:
    "Confirmed check {id}. It fails now, so the documentation looks wrong. Reply FIX for a tested correction.",
  dropDone:
    "Marked check {id} dropped for server verdicts. Repository plan removal is pending.",
  claimUnknown: "I couldn't find that claim in your open drift.",
  statusNone: "No linked repositories have a recorded run yet.",
  statusRepo: "{repo}: {label}, {degrees} degrees. {url}",
  runAnswer: "These passed on the last run for {repo}: {steps}. {corrections}",
  runUnverified:
    "I haven't verified a way to run {repo} yet. Latest run: {url}",
  repoResult:
    "Scanned {claims} claims. {label}, {degrees} degrees. {topIssue} It's on the Sky now: {url}",
  repoUnsupported: "{repo} has no README or package.json I can check yet.",
  wikiSuggestion: "Suggested wiki change for {source}: {text}",
  confluenceFooter:
    "Ground Control found a confirmed documentation mismatch. Evidence: {url}. Expected: {expected}. Actual: {actual}. Please review the page wording.",
  claimVerified: "Verified at {sha}. Expected: {expected}. Observed: {actual}.",
  claimDrifting:
    "Confirmed drift at {sha}. This page says: {quote}. Expected: {expected}. Observed: {actual}. Open fix: {url}",
  claimUnconfirmed:
    "This claim has not passed a verification run yet. Expected: {expected}. Latest result: {actual}.",
  claimDisputed:
    "The first check failed, so this claim needs review. This page says: {quote}. Expected: {expected}. Observed: {actual}.",
} as const;
