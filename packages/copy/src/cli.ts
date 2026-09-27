export const cliCopy = {
  localUsage:
    "Usage: bun run gc scan --owned [checkout] or bun run gc check --owned [checkout]. --private remains available for private checkouts.",
  localPrivateRequired:
    "Add --owned only for a checkout you own and chose to run locally. --private also works for private checkouts.",
  localCheckoutInvalid: "The selected checkout is not a readable directory.",
  localPlanMissing: "No saved flight plan was found. Run scan --owned first.",
  localPlanTooLarge: "The saved flight plan exceeds the inspection limit.",
  localPlanInvalid: "The saved flight plan did not pass validation.",
  localPlanUnreadable: "The saved flight plan could not be read.",
  localNoDocs: "No local README or documentation files were found.",
  localAnthropicKeyRequired:
    "Set ANTHROPIC_API_KEY before using EXTRACTION_MODEL=claude.",
  localGeminiKeyRequired:
    "Set GEMINI_API_KEY before using EXTRACTION_MODEL=gemini.",
  localExtractionModelInvalid:
    "Set EXTRACTION_MODEL to claude, gemini, or heuristic.",
  localScanFailed: "Local flightcheck initialization failed.",
  localRunFailed: "Local flightchecks could not finish.",
} as const;
