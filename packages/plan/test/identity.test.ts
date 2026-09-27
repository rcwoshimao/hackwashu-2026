import { expect, test } from "bun:test";
import fc from "fast-check";
import { canonicalJson, claimId, factKey } from "../src/index";

test("canonical JSON sorts keys recursively and refuses non-JSON values", () => {
  expect(
    canonicalJson({ b: [{ z: 1, a: true }], a: { y: null, x: "v" } }),
  ).toBe('{"a":{"x":"v","y":null},"b":[{"a":true,"z":1}]}');
  expect(canonicalJson({ a: 1, omitted: undefined })).toBe('{"a":1}');
  expect(() => canonicalJson(Number.NaN)).toThrow();
  expect(() => canonicalJson([undefined])).toThrow();
});

test("claim IDs are stable under object key order and quote whitespace", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 30 }),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ maxLength: 20 }),
      fc.integer(),
      (sourceId, text, a, b) => {
        const first = claimId(sourceId, `  ${text}  `, "file_exists", { a, b });
        const second = claimId(sourceId, text, "file_exists", { b, a });
        return first === second && /^c_[0-9a-f]{10}$/.test(first);
      },
    ),
    { numRuns: 1000 },
  );
  expect(claimId("s", "alpha\n beta", "env_var", { name: "PORT" })).toBe(
    claimId("s", "alpha beta", "env_var", { name: "PORT" }),
  );
  expect(claimId("s", "quote", "env_var", { name: "PORT" })).not.toBe(
    claimId("other", "quote", "env_var", { name: "PORT" }),
  );
});

test("fact keys group equal kinds and parameters across sources", () => {
  expect(factKey("port_listens", { startScript: "dev", port: 3000 })).toBe(
    factKey("port_listens", { port: 3000, startScript: "dev" }),
  );
  expect(factKey("port_listens", { port: 3000 })).not.toBe(
    factKey("port_listens", { port: 8080 }),
  );
});
