export const workflow = `name: Ground Control
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
jobs:
  ground-control:
    uses: rcwoshimao/hackwashu-2026/.github/workflows/ground-control-reusable.yml@main
    with:
      server: "https://<your-ground-control-host>"
    secrets:
      token: \${{ secrets.GROUND_CONTROL_TOKEN }}
`;

export function publicHttpsOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function workflowForBranch(branch: string, serverUrl: string): string {
  const origin = publicHttpsOrigin(serverUrl);
  if (!origin || !branch.trim()) throw new Error("public_url_required");
  return workflow
    .replace("branches: [main]", `branches: [${JSON.stringify(branch.trim())}]`)
    .replace('"https://<your-ground-control-host>"', JSON.stringify(origin));
}
