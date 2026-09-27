import { describe, expect, test } from "bun:test";
import { copy, lintCopy } from "../src/index.ts";

describe("copy deck", () => {
  test("product strings pass the copy rules", () => {
    expect(lintCopy(copy)).toEqual([]);
  });

  test("the linter catches banned phrasing and punctuation", () => {
    expect(lintCopy({ message: "A seamless journey!" })).toEqual([
      "message: exclamation mark",
      "message: seamless",
      "message: journey",
    ]);
  });
});
