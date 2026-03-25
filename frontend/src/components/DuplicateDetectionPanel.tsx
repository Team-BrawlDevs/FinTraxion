import type { DuplicateCandidate } from "@/lib/types";
import { computeOverlapPct } from "@/lib/overlap";

function overlapTagClass(pct: number) {
  if (pct >= 90) return "bg-red-500/10 border-red-500/20 text-red-200";
  if (pct >= 60) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-200";
  return "bg-slate-800/60 border-slate-700 text-slate-300";
}

export default function DuplicateDetectionPanel(props: { candidates: DuplicateCandidate[] }) {
  const { candidates } = props;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <h2 className="text-base font-bold text-sky-200">Duplicate Detection</h2>
      <p className="text-xs text-slate-400 mt-1">
        Overlapping SaaS tools detected from portfolio usage (mock overlap visualization).
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(candidates || []).slice(0, 10).map((c, idx) => {
          const pct = computeOverlapPct(c);
          const title =
            c.type === "exact_duplicate"
              ? `${c.service_a ?? "Unknown"} (Duplicate)`
              : `${c.service_a ?? "Unknown"} vs ${c.service_b ?? "Unknown"}`;

          return (
            <div key={`${title}-${idx}`} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-100 text-sm">{title}</div>
                <div className={`px-2 py-1 rounded-lg text-xs border ${overlapTagClass(pct)}`}>
                  {pct}% overlap
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {c.type}
                {c.category ? ` • ${c.category}` : ""}
              </div>

              <div className="mt-2 text-sm text-slate-200">
                {c.recommendation ?? "Overlap detected — review for consolidation."}
              </div>
            </div>
          );
        })}

        {(!candidates || candidates.length === 0) ? (
          <div className="text-sm text-slate-400">No overlaps detected yet.</div>
        ) : null}
      </div>
    </div>
  );
}

