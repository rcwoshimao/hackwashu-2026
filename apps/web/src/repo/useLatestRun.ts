import { useEffect, useState } from "react";
import { api } from "../api.ts";
import type { RunData } from "../data.ts";

export function useLatestRun(id: string | null): {
  run: RunData | null;
  loading: boolean;
} {
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(id !== null);
  useEffect(() => {
    setRun(null);
    if (!id) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void api.run(id, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setRun(result.ok ? result.value : null);
      setLoading(false);
    });
    return () => controller.abort();
  }, [id]);
  return { run, loading };
}
