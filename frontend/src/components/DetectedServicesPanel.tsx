import type { MockServiceRow } from "@/lib/types";
import { formatINR } from "@/lib/mock";

export default function DetectedServicesPanel(props: { services: MockServiceRow[] }) {
  const { services } = props;

  return (
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Detected services</h2>
          <p className="text-xs text-muted mt-1">
            Usage & pricing derived from detected duplicates (safe for testing).
          </p>
        </div>
        <div className="text-xs text-muted font-medium">{services.length} services</div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="py-2 pr-3 font-semibold">Service name</th>
              <th className="py-2 pr-3 font-semibold">Monthly cost</th>
              <th className="py-2 pr-3 font-semibold">Active users</th>
              <th className="py-2 pr-3 font-semibold">Usage %</th>
              <th className="py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(37,99,235,0.08)] text-ink">
            {services.length === 0 ? (
              <tr>
                <td className="py-3 text-muted" colSpan={5}>
                  No services detected yet.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.name}>
                  <td className="py-2 pr-3 font-semibold">{s.name}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{formatINR(s.monthlyCost)}</td>
                  <td className="py-2 pr-3">{s.activeUsers}</td>
                  <td className="py-2 pr-3">{s.usagePct}%</td>
                  <td className="py-2">
                    <span
                      className={[
                        "inline-flex items-center px-2 py-1 rounded-md text-xs border font-medium",
                        s.status === "Underutilized"
                          ? "bg-warning-light border-warning/30 text-warning"
                          : "bg-success-light border-emerald-300 text-emerald-900",
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
