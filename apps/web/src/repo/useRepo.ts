import { useEffect, useState } from "react";
import { api } from "../api.ts";
import type { RepoData } from "../data.ts";

export function useRepo(repo: string): {
  data: RepoData | null;
  loading: boolean;
  denied: boolean;
} {
  const [data, setData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      const result = await api.repo(repo, controller.signal);
      if (controller.signal.aborted) return;
      setData(result.ok ? result.value : null);
      setDenied(!result.ok && result.error.code === "access");
      setLoading(false);
    };
    void load();
    return () => controller.abort();
  }, [repo]);
  return { data, loading, denied };
}
