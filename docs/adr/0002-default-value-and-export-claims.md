# ADR 0002: exact default values and export claims

Status: proposed for teammate review. The current `FlightPlan` and runner public types stay unchanged.

## Context

Hussein's check menu mentions JavaScript and TypeScript exports and default values. The shipped `code_reference` check finds a named declaration or export, and `env_var` finds a read. Neither proves that a symbol is actually exported from a module's public surface or that a documented default has a particular value. Marking such claims `pass` from name existence would overstate evidence.

## Proposed decision

Keep these claims `unverified` under the nine-kind contract until the owners approve typed extensions to the two existing static kinds. Do not add a tenth check kind:

- Extend `code_reference.params` from `{ name }` with an optional typed `assertion`: `{ type: "export"; modulePath: string }` or `{ type: "literal_default"; modulePath: string; value: Literal }`. `export` passes only when that tracked JS/TS module exports the exact name through a direct export, export list, or statically resolvable re-export. `literal_default` passes only when a parser finds one unambiguous literal initializer or default parameter for that name. Dynamic CommonJS assignment and type-only exports need explicit rules before implementation.
- Extend `env_var.params` from `{ name }` with optional `{ assertion: { type: "literal_fallback"; modulePath: string; value: Literal } }`. This would prove a literal fallback on a specific environment read, not merely that the variable is referenced. Numeric, boolean, string, null, and undefined literals need canonical comparison. Expressions, multiple candidate reads, and environment-dependent values remain `unverified`.

`Literal` would be a versioned tagged union for string, number, boolean, null, and undefined so JSON serialization cannot conflate missing and undefined values. Both extensions would be static and read-only. They would never evaluate an expression, import a target module, install dependencies, or execute target code. A model proposal must include an exact quote and valid typed parameters; source grounding and deterministic runner evidence remain required. Public scans could use these checks only after implementation passes security and accuracy review.

## Merge consequences

Changing `packages/plan` check parameters affects the runner, Action bundle, API telemetry schema, stored plans, scanner, web labels, and fixture contracts. Merge the schema and deterministic runner together, then update downstream packages against one versioned contract. Keep the current nine kinds and current parameter shapes for this hackathon branch until that coordinated change lands. The checked-in Hussein telemetry fixtures and `bun run check` remain valid on the current contract.

## Acceptance evidence for a future implementation

- Unit cases distinguish declarations from true exports and avoid comment/string false positives.
- Default-value cases cover literal values, aliased exports, multiple candidate definitions, re-exports, and dynamic expressions; ambiguous cases are `unverified`.
- A public scanner test proves zero target-code execution for both new kinds.
- Property tests prove repeated source and plan inputs yield byte-identical checks and grounded quotes.
- The Action, server, web, and integration fixtures accept the extended parameters after a schema version bump while the nine-kind discriminator remains unchanged.
