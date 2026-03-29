import type { MockServiceRow } from "@/lib/types";
import { formatINR } from "@/lib/mock";

export default function DetectedServicesPanel(props: { services: MockServiceRow[] }) {
  const { services } = props;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl group/panel transition-all duration-500 hover:border-sky-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative flex items-start justify-between gap-4 z-10">
        <div>
          <h2 className="bg-gradient-to-r from-sky-700 via-blue-600 to-sky-500 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
            Detected services
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg font-medium leading-relaxed">
            Usage & pricing derived from detected duplicates (safe for testing).
          </p>
        </div>
        <div className="text-xs text-sky-700 font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-sky-200 bg-sky-50 backdrop-blur-sm shadow-sm">
          {services.length} services
        </div>
      </div>

      <div className="relative z-10 mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 shadow-inner">
        <table className="w-full text-sm">
          <thead className="bg-slate-100/80 text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-bold">Service name</th>
              <th className="py-3 px-4 font-bold">Monthly cost</th>
              <th className="py-3 px-4 font-bold">Active users</th>
              <th className="py-3 px-4 font-bold">Usage %</th>
              <th className="py-3 px-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 text-slate-600 font-medium bg-white/40">
            {services.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-400 italic font-medium" colSpan={5}>
                  No services detected yet.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.name} className="transition-colors hover:bg-slate-50 group/row">
                  <td className="py-4 px-4 font-semibold text-slate-900 group-hover/row:text-sky-700 transition-colors">{s.name}</td>
                  <td className="py-4 px-4 font-mono tabular-nums text-slate-600 group-hover/row:text-slate-900 transition-colors">{formatINR(s.monthlyCost)}</td>
                  <td className="py-4 px-4 text-slate-500 group-hover/row:text-slate-700 transition-colors">{s.activeUsers}</td>
                  <td className="py-4 px-4 text-slate-500 group-hover/row:text-slate-700 transition-colors">{s.usagePct}%</td>
                  <td className="py-4 px-4">
                    <span
                      className={[
                        "inline-flex items-center px-3 py-1.5 rounded-md border text-[11px] font-bold uppercase tracking-widest shadow-sm",
                        s.status === "Underutilized"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700",
                      ].join(" ")}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
