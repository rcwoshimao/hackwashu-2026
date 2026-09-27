# 0001: Phase 1 source and plan schema

## Status

Accepted for the Phase 1 implementation, pending the phase review that freezes public types.

## Context

The master prompt requires six source kinds, position-mapped DocText, nine check kinds, trust states, fact-grouped evidence, and stable IDs. The spec lists check behavior but leaves several serialized field names and shapes open. A connected repo can have many sources; the earlier single-README `docSha` example cannot identify all of them.

## Decision

- A `Source` has a stable caller-assigned `id`, one connected `repo`, and a kind-specific path, page ID, or URL. Git-backed readme, docs, and man sources use concrete repository-relative paths. Config glob expansion occurs before source records are made.
- `DocText.text` is the normalized text. Ordered `spans` identify its heading, ordinary text, and code ranges. Each span carries a `Location` whose offsets address `DocText.text`; file locations also carry original line ranges, while remote locations carry page identity and heading path. A converter must preserve the original mapping. Exact quote verification requires a covering span from the same source origin and an exact substring of the normalized range. File line-to-offset consistency is the converter's responsibility because no source file is present during schema parsing.
- A `Claim` has one source, a kind and validated parameters, a tier, and one or more occurrences. Each occurrence holds its exact quote and location. Its ID uses the master prompt's source ID, whitespace-normalized occurrence quote, kind, and recursively key-sorted JSON parameters; every occurrence must compute the same ID. Canonical JSON omits undefined object properties and rejects non-JSON array values. Location is excluded from identity, as required.
- Repeated identical facts within one source become one claim with multiple occurrences. This also preserves exact quotations that differ only in whitespace and therefore share an ID. `FlightPlan` rejects duplicate IDs so callers must merge occurrences before serialization. The plan holds one SHA-256 content hash per source rather than a single `docSha`. The order of claims and occurrences remains the caller's deterministic responsibility.
- `cli_flag` may use a static source-literal check or a runtime `--help` check when a package has `bin`; its schema permits either tier. The Phase 1 runner implements the first five static kinds, and Phase 2 adds `cli_flag` with the three runtime kinds.
- `http_example` uses the exact `method`, `path`, `expectedStatus`, and `expectedKeys` fields from spec section 14.1; its port is supplied by the shared server start. Optional command and port timeouts cannot exceed the section 15.4 limits.
- `command_succeeds` accepts an allowed first word and rejects shell operators, command substitution, redirection, and newlines. The later provenance check must still establish that the exact command is in a source code block or package script.
- Evidence is grouped by `factKey(kind, params)` across sources. Each occurrence carries the exact quote and location, expected and actual results, commit provenance, deep link, and source-specific fix descriptor. Actual output is limited to 20 lines. Trust is a four-value server-side state and is never embedded in the committed flight plan.

## Consequences

Source converters, extraction, and evidence building can be added without changing these public types. Runtime command provenance and source quote grounding require source text or package scripts and are checked by later logic, not by the check-kind schema alone.
