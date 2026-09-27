import { statusView } from "../presentation.ts";

export function StatusBadge({ label }: { label: string }) {
  const view = statusView(label);
  return (
    <span className={`status-badge ${view.className}`}>
      <span aria-hidden="true">{view.symbol}</span> {view.text}
    </span>
  );
}
