import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { claimId } from "../../../packages/plan/src/index.ts";
import { rerunSavedChecks } from "../src/local.ts";

const mainPath = resolve(import.meta.dir, "../src/main.ts");

function temporaryCheckout(): string {
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-local-cli-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Temporary checkout left the system temp directory");
  return root;
}

async function invoke(
  root: string,
  args: string[],
): Promise<{
  exit: number;
  stdout: string;
  stderr: string;
}> {
  const child = Bun.spawn([process.execPath, mainPath, ...args], {
    cwd: root,
    env: {
      ...process.env,
      GEMINI_API_KEY: "",
      EXTRACTION_MODEL: "heuristic",
      DATABASE_PATH: join(root, "groundcontrol-cache.db"),
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exit, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { exit, stdout, stderr };
}

test("scan initializes and checks a no-Git checkout from any working directory", async () => {
  const root = temporaryCheckout();
  try {
    writeFileSync(
      join(root, "README.md"),
      "# Local app\n\nRun `npm run dev`.\n",
    );
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ scripts: { dev: "node app.mjs" } }),
    );
    const denied = await invoke(root, ["scan"]);
    expect(denied.exit).toBe(1);
    expect(existsSync(join(root, "flightchecks"))).toBe(false);
    const scanned = await invoke(root, ["scan", "--private"]);
    expect(scanned.exit).toBe(0);
    expect(scanned.stderr).toBe("");
    expect(existsSync(join(root, ".git"))).toBe(false);
    expect(existsSync(join(root, "flightchecks", "runner.mjs"))).toBe(true);
    expect(existsSync(join(root, "flightchecks", "flight.test.mjs"))).toBe(
      true,
    );
    const summary: unknown = JSON.parse(scanned.stdout);
    expect(summary).toMatchObject({
      generated: true,
      sources: 1,
      counts: { pass: 1, fail: 0 },
    });
    const checked = await invoke(root, ["check", "--private"]);
    expect(checked.exit).toBe(0);
    expect(checked.stdout).toContain('"generated": false');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("saved runtime checks execute only after explicit private opt-in", async () => {
  const root = temporaryCheckout();
  try {
    const command = "node check.mjs";
    const marker = join(root, "ran.marker");
    writeFileSync(
      join(root, "README.md"),
      `# Check\n\n\`\`\`sh\n${command}\n\`\`\`\n`,
    );
    writeFileSync(
      join(root, "check.mjs"),
      'import { writeFileSync } from "node:fs"; writeFileSync("ran.marker", "yes"); process.stdout.write("private output");',
    );
    mkdirSync(join(root, "flightchecks"));
    const sourceId = "local_readme";
    const quote = command;
    const params = { command };
    const plan = {
      repo: "local/private-checkout",
      sourceHashes: { [sourceId]: "a".repeat(64) },
      claims: [
        {
          id: claimId(sourceId, quote, "command_succeeds", params),
          sourceId,
          kind: "command_succeeds",
          params,
          tier: "runtime",
          occurrences: [
            {
              quote,
              location: {
                kind: "file",
                sourceId,
                path: "README.md",
                lineStart: 4,
                lineEnd: 4,
                startOffset: 0,
                endOffset: command.length,
              },
            },
          ],
        },
      ],
    };
    writeFileSync(
      join(root, "flightchecks", "flightplan.json"),
      JSON.stringify(plan),
    );
    const denied = await rerunSavedChecks(root, false);
    expect(denied).toEqual({
      ok: false,
      error: { code: "private_confirmation_required" },
    });
    expect(existsSync(marker)).toBe(false);
    const checked = await invoke(root, ["check", "--private"]);
    expect(checked.exit).toBe(0);
    expect(checked.stdout).toContain('"status": "pass"');
    expect(checked.stdout).not.toContain("private output");
    expect(readFileSync(marker, "utf8")).toBe("yes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("invalid saved plan is rejected before any code runs", async () => {
  const root = temporaryCheckout();
  try {
    mkdirSync(join(root, "flightchecks"));
    writeFileSync(join(root, "flightchecks", "flightplan.json"), "{}");
    const result = await rerunSavedChecks(root, true);
    expect(result).toEqual({ ok: false, error: { code: "plan_invalid" } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
