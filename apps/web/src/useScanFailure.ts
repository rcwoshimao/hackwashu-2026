import { useEffect, useRef } from "react";
import { scanFailedFor } from "./scanFeedback.ts";

export function useScanFailure(
  requestId: string | null,
  onFailure: () => void,
): void {
  const callback = useRef(onFailure);
  callback.current = onFailure;
  useEffect(() => {
    if (requestId === null) return;
    const events = new EventSource("/api/events");
    const failed = (event: Event) => {
      if (
        !(event instanceof MessageEvent) ||
        typeof event.data !== "string" ||
        !scanFailedFor(event.data, requestId)
      )
        return;
      callback.current();
      events.close();
    };
    events.addEventListener("scan_failed", failed);
    return () => {
      events.removeEventListener("scan_failed", failed);
      events.close();
    };
  }, [requestId]);
}
