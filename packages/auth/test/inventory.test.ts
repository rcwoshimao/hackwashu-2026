import { expect, test } from "bun:test";
import { GitHubHttp } from "../src/index.ts";

test("GitHub inventory follows pages and keeps only display metadata", async () => {
  const requested: URL[] = [];
  const github = new GitHubHttp("id", "secret", async (url, init) => {
    requested.push(new URL(url));
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer oauth-token",
    );
    const page = new URL(url).searchParams.get("page");
    return Response.json(
      [
        {
          full_name: page === "1" ? "owner/first" : "owner/second",
          private: page === "1",
          permissions: { admin: page === "1" },
          description: null,
          language: "TypeScript",
          updated_at: "2026-09-26T10:00:00Z",
          archived: false,
          fork: false,
          secret_field: "discard-this",
        },
      ],
      {
        headers:
          page === "1"
            ? { Link: '<https://api.github.com/user/repos?page=2>; rel="next"' }
            : {},
      },
    );
  });
  const result = await github.listRepositories("oauth-token");
  expect(result).toMatchObject({
    ok: true,
    value: {
      truncated: false,
      repos: [
        { repo: "owner/first", visibility: "private", canAdmin: true },
        { repo: "owner/second", visibility: "public", canAdmin: false },
      ],
    },
  });
  expect(JSON.stringify(result)).not.toContain("discard-this");
  expect(requested.map((url) => url.searchParams.get("page"))).toEqual([
    "1",
    "2",
  ]);
  expect(requested[0]?.searchParams.get("per_page")).toBe("100");
});
