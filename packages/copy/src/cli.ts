export const cliCopy = {
  localUsage:
    "Usage: bun run gc scan --private [checkout] or bun run gc check --private [checkout].",
  localPrivateRequired:
    "Add --private only for a private checkout you chose to run locally.",
  localCheckoutInvalid: "The selected checkout is not a readable directory.",
  localPlanMissing: "No saved flight plan was found. Run scan --private first.",
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
