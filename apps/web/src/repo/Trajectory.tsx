import { copy } from "@ground-control/copy";
import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { confirmedDriftDegrees, type RepoData } from "../data.ts";

type TrajectoryPoint = {
  id: string;
  commitSha: string;
  degrees: number;
  createdAt: string;
};

function useTrajectory(repo: RepoData): {
  points: TrajectoryPoint[];
  loading: boolean;
  unavailable: boolean;
} {
  const [points, setPoints] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setPoints([]);
    setLoading(true);
    const load = async () => {
      const summaries = repo.runs.slice(0, 12);
      const details = await Promise.all(
        summaries.map((summary) => api.run(summary.id, controller.signal)),
      );
      if (controller.signal.aborted) return;
      setUnavailable(details.some((detail) => !detail.ok));
      const measured = details.flatMap((detail) => {
        if (!detail.ok) return [];
        const degrees = confirmedDriftDegrees(detail.value);
        return degrees === null
          ? []
          : [
              {
                id: detail.value.id,
                commitSha: detail.value.commitSha,
                createdAt: detail.value.createdAt,
                degrees,
              },
            ];
      });
      setPoints(
        measured.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      );
      setLoading(false);
    };
    void load();
    return () => controller.abort();
  }, [repo]);
  return { points, loading, unavailable };
}

export function Trajectory({ repo }: { repo: RepoData }) {
  const { points, loading, unavailable } = useTrajectory(repo);
  if (loading || points.length < 2)
    return (
      <section className="trajectory panel">
        <h2>{copy.repoTrajectory}</h2>
        <p>
          {loading
            ? copy.repoTrajectoryLoading
            : unavailable
              ? copy.repoTrajectoryUnavailable
              : copy.repoTrajectoryShort}
        </p>
      </section>
    );
  const xFor = (index: number) =>
    points.length === 1 ? 400 : 42 + (index * 716) / (points.length - 1);
  const path = points
    .map((point, index) => `${xFor(index)},${174 - point.degrees * 1.35}`)
    .join(" ");
  return (
    <section className="trajectory panel">
      <h2>{copy.repoTrajectory}</h2>
      <p>{copy.repoTrajectoryNote}</p>
      <svg
        viewBox="0 0 800 220"
        role="img"
        aria-label={copy.repoTrajectoryNote}
      >
        <line x1="42" y1="174" x2="758" y2="174" className="trajectory-plan" />
        <polyline points={path} className="trajectory-code" />
        {points.map((point, index) => (
          <g key={point.id}>
            <circle
              cx={xFor(index)}
              cy={174 - point.degrees * 1.35}
              r="6"
              className={
                point.degrees > 0 ? "trajectory-drift" : "trajectory-point"
              }
            >
              <title>
                {point.commitSha.slice(0, 10)} · {point.degrees.toFixed(1)}{" "}
                {copy.skyDegreesUnit}
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <ul className="trajectory-data">
        {points.map((point) => (
          <li key={point.id}>
            <a href={`/runs/${encodeURIComponent(point.id)}`}>
              {point.commitSha.slice(0, 10)}
            </a>
            <span>
              {point.degrees.toFixed(1)} {copy.skyDegreesUnit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
