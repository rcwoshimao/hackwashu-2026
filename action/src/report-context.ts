export type ReportIdentity = {
  repo: string;
  commitSha: string;
  pullRequestNumber?: number;
};

export type GitHubWorkflowContext = {
  repository: string | undefined;
  workflowSha: string | undefined;
  eventName: string | undefined;
  event: unknown;
};

const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const shaPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;

function field(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function validReportIdentity(
  identity: ReportIdentity | null,
): identity is ReportIdentity {
  return (
    identity !== null &&
    repoPattern.test(identity.repo) &&
    shaPattern.test(identity.commitSha) &&
    (identity.pullRequestNumber === undefined ||
      (Number.isSafeInteger(identity.pullRequestNumber) &&
        identity.pullRequestNumber > 0 &&
        identity.pullRequestNumber <= 2_147_483_647))
  );
}

export function trustedReportIdentity(
  context: GitHubWorkflowContext,
): ReportIdentity | null {
  const { repository, workflowSha, eventName, event } = context;
  if (
    !repository ||
    !workflowSha ||
    !repoPattern.test(repository) ||
    !shaPattern.test(workflowSha)
  )
    return null;
  if (eventName === "pull_request") {
    const head = field(event, ["pull_request", "head", "sha"]);
    const number = field(event, ["number"]);
    const eventRepo = field(event, ["repository", "full_name"]);
    if (
      typeof head !== "string" ||
      !shaPattern.test(head) ||
      typeof number !== "number" ||
      !Number.isSafeInteger(number) ||
      number < 1 ||
      number > 2_147_483_647 ||
      eventRepo !== repository
    )
      return null;
    return { repo: repository, commitSha: head, pullRequestNumber: number };
  }
  if (
    eventName !== "push" &&
    eventName !== "schedule" &&
    eventName !== "workflow_dispatch"
  )
    return null;
  const after = field(event, ["after"]);
  if (eventName === "push" && after !== null && after !== workflowSha)
    return null;
  return { repo: repository, commitSha: workflowSha };
}
