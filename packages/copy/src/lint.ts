import { copy, lintCopy } from "./index.ts";

const issues = lintCopy(copy);
if (issues.length > 0) {
  process.stderr.write(`${issues.join("\n")}\n`);
  process.exitCode = 1;
}
