import type { MockServiceRow } from "@/lib/types";
import { formatINR } from "@/lib/mock";

export default function DetectedServicesPanel(props: { services: MockServiceRow[] }) {
  const { services } = props;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">Detected Services</h2>
          <p className="text-xs text-slate-400 mt-1">
            Mocked usage & pricing derived from detected duplicates (safe for internal testing).
          </p>
        </div>
        <div className="text-xs text-slate-400">{services.length} services</div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2 pr-3">Service Name</th>
              <th className="py-2 pr-3">Monthly Cost</th>
              <th className="py-2 pr-3">Active Users</th>
              <th className="py-2 pr-3">Usage %</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {services.length === 0 ? (
              <tr>
                <td className="py-3 text-slate-400" colSpan={5}>
                  No services detected yet.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.name}>
                  <td className="py-2 pr-3 font-semibold">{s.name}</td>
                  <td className="py-2 pr-3">{formatINR(s.monthlyCost)}</td>
                  <td className="py-2 pr-3">{s.activeUsers}</td>
                  <td className="py-2 pr-3">{s.usagePct}%</td>
                  <td className="py-2">
                    <span
                      className={[
                        "inline-flex items-center px-2 py-1 rounded-lg text-xs border",
                        s.status === "Underutilized"
                          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
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

