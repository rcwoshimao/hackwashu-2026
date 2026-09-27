import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { flightPlanSchema } from "../../../packages/plan/src/index.ts";
import { copyOrbitFixture, isolateOrbitPort } from "../src/orbit-fixture.ts";

test("temporary Orbit source and plan use the same isolated port", () => {
  const source = join(process.cwd(), "demo/orbit-app");
  const root = mkdtempSync(join(tmpdir(), "groundcontrol-orbit-"));
  if (!realpathSync(root).startsWith(`${realpathSync(tmpdir())}${sep}`))
    throw new Error("Orbit fixture escaped temp directory");
  try {
    copyOrbitFixture(source, root);
    const plan = isolateOrbitPort(root, 43211);
    const portClaim = plan.claims.find(
      (claim) => claim.kind === "port_listens",
    );
    expect(portClaim?.params.port).toBe(43211);
    expect(portClaim?.occurrences[0]?.quote).toContain("43211");
    expect(readFileSync(join(root, "README.md"), "utf8")).toContain(
      "port 43211",
    );
    expect(readFileSync(join(root, "src/server.js"), "utf8")).toContain(
      'process.env.PORT ?? "43211"',
    );
    expect(readFileSync(join(source, "src/server.js"), "utf8")).toContain(
      'process.env.PORT ?? "3000"',
    );
    expect(
      flightPlanSchema.safeParse(
        JSON.parse(
          readFileSync(join(root, "flightchecks/flightplan.json"), "utf8"),
        ),
      ).success,
    ).toBe(true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
