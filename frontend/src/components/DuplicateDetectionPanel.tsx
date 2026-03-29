import type { DuplicateCandidate } from "@/lib/types";
import { computeOverlapPct } from "@/lib/overlap";

function overlapTagClass(pct: number) {
  if (pct >= 90) return "bg-danger-light border-danger/30 text-danger";
  if (pct >= 60) return "bg-warning-light border-warning/30 text-warning";
  return "bg-gray-50 border-edge text-muted";
}

export default function DuplicateDetectionPanel(props: { candidates: DuplicateCandidate[] }) {
  const { candidates } = props;

  return (
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <h2 className="font-display text-xl text-ink">Duplicate detection</h2>
      <p className="text-xs text-muted mt-1">
        Overlapping SaaS tools from portfolio usage (overlap visualization).
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(candidates || []).slice(0, 10).map((c, idx) => {
          const pct = computeOverlapPct(c);
          const title =
            c.type === "exact_duplicate"
              ? `${c.service_a ?? "Unknown"} (duplicate)`
              : `${c.service_a ?? "Unknown"} vs ${c.service_b ?? "Unknown"}`;

          return (
            <div
              key={`${title}-${idx}`}
              className="rounded-md border border-edge bg-gray-50/80 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-ink text-sm">{title}</div>
                <div className={`px-2 py-1 rounded-md text-xs border font-medium ${overlapTagClass(pct)}`}>
                  {pct}% overlap
                </div>
              </div>

              <div className="mt-1 text-xs text-muted">
                {c.type}
                {c.category ? ` • ${c.category}` : ""}
              </div>

              <div className="mt-2 text-sm text-ink leading-relaxed">
                {c.recommendation ?? "Overlap detected — review for consolidation."}
              </div>
            </div>
          );
        })}

        {!candidates || candidates.length === 0 ? (
          <div className="text-sm text-muted md:col-span-2">No overlaps detected yet.</div>
        ) : null}
      </div>
    </div>
  );
}
