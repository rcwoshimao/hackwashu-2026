#!/usr/bin/env node
import { listPlanets } from "../src/catalog.js";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  process.stdout.write("Usage: orbit --format json|table\n");
  process.exit(0);
}
const formatIndex = args.indexOf("--format");
const format = formatIndex >= 0 ? args[formatIndex + 1] : "table";
if (format !== "json" && format !== "table") {
  process.stderr.write("Choose --format json or --format table\n");
  process.exit(2);
}
if (format === "json") {
  process.stdout.write(`${JSON.stringify(listPlanets())}\n`);
} else {
  for (const planet of listPlanets()) process.stdout.write(`${planet}\n`);
}
