import type { DuplicateCandidate } from "@/lib/types";
import { computeOverlapPct } from "@/lib/overlap";

function overlapTheme(pct: number) {
  if (pct >= 90) return {
    tag: "bg-rose-50 border-rose-200 text-rose-700 shadow-sm",
    card: "border-rose-200 bg-white/60 hover:border-rose-300 hover:shadow-md hover:bg-white",
    bar: "bg-gradient-to-b from-rose-400 to-rose-500 group-hover/card:from-rose-500 group-hover/card:to-rose-600"
  };
  if (pct >= 60) return {
    tag: "bg-amber-50 border-amber-200 text-amber-700 shadow-sm",
    card: "border-amber-200 bg-white/60 hover:border-amber-300 hover:shadow-md hover:bg-white",
    bar: "bg-gradient-to-b from-amber-400 to-amber-500 group-hover/card:from-amber-500 group-hover/card:to-amber-600"
  };
  return {
    tag: "bg-slate-50 border-slate-200 text-slate-500 shadow-sm",
    card: "border-slate-200 bg-white/40 hover:border-slate-300 hover:shadow-md hover:bg-white/80",
    bar: "bg-slate-300 group-hover/card:bg-slate-400"
  };
}

export default function DuplicateDetectionPanel(props: { candidates: DuplicateCandidate[] }) {
  const { candidates } = props;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl group/panel transition-all duration-500 hover:border-rose-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute -top-40 -left-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative z-10">
        <h2 className="bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
          Duplicate detection
        </h2>
        <p className="text-sm text-slate-600 mt-2 font-medium max-w-lg leading-relaxed">
          Overlapping SaaS tools from portfolio usage (overlap visualization).
        </p>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(candidates || []).slice(0, 10).map((c, idx) => {
          const pct = computeOverlapPct(c);
          const theme = overlapTheme(pct);
          const title =
            c.type === "exact_duplicate"
              ? `${c.service_a ?? "Unknown"} (duplicate)`
              : `${c.service_a ?? "Unknown"} vs ${c.service_b ?? "Unknown"}`;

          return (
            <div
              key={`${title}-${idx}`}
              className={`group/card relative overflow-hidden rounded-xl border ${theme.card} p-5 transition-all duration-300 shadow-[inset_0_1px_5px_rgba(255,255,255,0.02)]`}
            >
              <div className={`absolute inset-y-0 left-0 w-[5px] rounded-l-xl ${theme.bar} transition-colors duration-300`}></div>
              
              <div className="flex items-start justify-between gap-3 pl-3">
                <div className="font-bold text-slate-900 text-[15px]">{title}</div>
                <div className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${theme.tag}`}>
                  {pct}% overlap
                </div>
              </div>

              <div className="mt-2 pl-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {c.type}
                {c.category ? ` • ${c.category}` : ""}
              </div>

              <div className="mt-3 pl-3 text-sm text-slate-700 font-medium leading-relaxed">
                {c.recommendation ?? "Overlap detected — review for consolidation."}
              </div>
            </div>
          );
        })}

        {!candidates || candidates.length === 0 ? (
          <div className="text-sm text-slate-500 italic font-medium md:col-span-2 text-center py-4 bg-slate-50/80 rounded-xl border border-slate-200 shadow-inner">
            No overlaps detected yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
