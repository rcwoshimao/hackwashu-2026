import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.ts";
import type { SkyData } from "../data.ts";

export type SkyLoadState = "loading" | "ready" | "stale" | "error";

export function useSky(): {
  data: SkyData | null;
  state: SkyLoadState;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<SkyData | null>(null);
  const [state, setState] = useState<SkyLoadState>("loading");
  const latest = useRef<SkyData | null>(null);
  const refresh = useCallback(async () => {
    const result = await api.sky();
    if (result.ok) {
      latest.current = result.value;
      setData(result.value);
      setState("ready");
    } else {
      const saved = latest.current
        ? {
            ...latest.current,
            mode:
              latest.current.mode === "simulated"
                ? ("simulated" as const)
                : ("cached" as const),
          }
        : null;
      if (saved) {
        latest.current = saved;
        setData(saved);
        setState("stale");
        return;
      }
      const fallback = await api.cachedSky();
      if (fallback.ok) {
        const snapshot = {
          ...fallback.value,
          mode:
            fallback.value.mode === "simulated"
              ? ("simulated" as const)
              : ("cached" as const),
        };
        latest.current = snapshot;
        setData(snapshot);
        setState("stale");
      } else setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const events = new EventSource("/api/events");
    let timer = 0;
    const schedule = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 350);
    };
    events.onmessage = schedule;
    document.addEventListener("visibilitychange", schedule);
    return () => {
      events.close();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [refresh]);
  return { data, state, refresh };
}
