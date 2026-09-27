import { useEffect, useState } from "react";
import { api } from "../api.ts";
import type { MeData } from "../data.ts";

export function useMe(): {
  me: MeData | null;
  loading: boolean;
  failed: boolean;
} {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const result = await api.me(controller.signal);
      if (!controller.signal.aborted) {
        setMe(result.ok ? result.value : null);
        setFailed(!result.ok);
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, []);
  return { me, loading, failed };
}
