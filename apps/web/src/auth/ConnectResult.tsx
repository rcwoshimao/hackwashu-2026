import { copy } from "@ground-control/copy";
import type { Connection } from "../api.ts";
import { ConnectActionSteps } from "./ConnectActionSteps.tsx";

export function ConnectResult({
  connection,
  serverUrl,
}: {
  connection: Connection;
  serverUrl: string;
}) {
  return (
    <>
      <p className="form-feedback" role="status">
        {connection.visibility === "private"
          ? copy.connectDonePrivate
          : connection.telemetryToken
            ? copy.connectDonePublicRuntime
            : connection.runtimeEnabled
              ? copy.connectDonePublicRuntimeExisting
              : copy.connectDonePublic}
      </p>
      {connection.runtimeEnabled && (
        <ConnectActionSteps
          repo={connection.repo}
          serverUrl={serverUrl}
          token={connection.telemetryToken}
        />
      )}
      <a href={`/sources/new?repo=${encodeURIComponent(connection.repo)}`}>
        {copy.repoAddSource}
      </a>
    </>
  );
}
