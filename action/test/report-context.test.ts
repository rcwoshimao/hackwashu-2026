import { expect, test } from "bun:test";
import {
  trustedReportIdentity,
  validReportIdentity,
} from "../src/report-context.ts";

const repo = "team/orbit-app";
const head = "a".repeat(40);
const merge = "b".repeat(40);

test("PR report identity uses GitHub's head SHA rather than its merge SHA", () => {
  const context = {
    repository: repo,
    workflowSha: merge,
    eventName: "pull_request",
    event: {
      repository: { full_name: repo },
      number: 7,
      pull_request: { head: { sha: head } },
    },
  };
  expect(trustedReportIdentity(context)).toEqual({
    repo,
    commitSha: head,
    pullRequestNumber: 7,
  });
  expect(
    trustedReportIdentity({
      ...context,
      event: {
        ...context.event,
        repository: { full_name: "attacker/orbit-app" },
      },
    }),
  ).toBeNull();
  expect(
    trustedReportIdentity({
      ...context,
      event: { ...context.event, number: 0 },
    }),
  ).toBeNull();
});

test("push and dispatch identity use GitHub's workflow SHA and fail closed", () => {
  expect(
    trustedReportIdentity({
      repository: repo,
      workflowSha: head,
      eventName: "push",
      event: { after: head },
    }),
  ).toEqual({ repo, commitSha: head });
  expect(
    trustedReportIdentity({
      repository: repo,
      workflowSha: head,
      eventName: "push",
      event: { after: merge },
    }),
  ).toBeNull();
  expect(
    trustedReportIdentity({
      repository: repo,
      workflowSha: head,
      eventName: "workflow_dispatch",
      event: {},
    }),
  ).toEqual({ repo, commitSha: head });
  expect(
    trustedReportIdentity({
      repository: repo,
      workflowSha: head,
      eventName: "pull_request_target",
      event: {},
    }),
  ).toBeNull();
  expect(validReportIdentity({ repo, commitSha: head })).toBe(true);
  expect(validReportIdentity({ repo, commitSha: "short" })).toBe(false);
});
