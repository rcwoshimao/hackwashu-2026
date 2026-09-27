import { strict as assert } from "node:assert";
import { test } from "node:test";
import { repoFromInput } from "./presentation.ts";

test("any GitHub link or owner/repo resolves to owner/repo", () => {
  for (const input of [
    "rcwoshimao/ground-control-sample",
    "  rcwoshimao/ground-control-sample  ",
    "https://github.com/rcwoshimao/ground-control-sample",
    "https://github.com/rcwoshimao/ground-control-sample/",
    "https://github.com/rcwoshimao/ground-control-sample/tree/main/src",
    "https://github.com/rcwoshimao/ground-control-sample/blob/main/README.md",
    "https://github.com/rcwoshimao/ground-control-sample.git",
    "https://github.com/rcwoshimao/ground-control-sample?tab=readme-ov-file",
    "https://github.com/rcwoshimao/ground-control-sample#readme",
    "http://www.github.com/rcwoshimao/ground-control-sample",
    "github.com/rcwoshimao/ground-control-sample",
    "git@github.com:rcwoshimao/ground-control-sample.git",
  ])
    assert.equal(
      repoFromInput(input),
      "rcwoshimao/ground-control-sample",
      input,
    );
});

test("input that names no GitHub repository is rejected", () => {
  for (const input of [
    "",
    "react",
    "https://github.com/rcwoshimao",
    "https://gitlab.com/owner/repo",
    "https://example.com/github.com/owner/repo",
    "owner name/repo",
  ])
    assert.equal(repoFromInput(input), null, input);
});
