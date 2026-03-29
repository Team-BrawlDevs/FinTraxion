type Props = {
  label: string;
  isComplete: boolean;
  isActive: boolean;
  isPending: boolean;
};

export default function AgentStep({ label, isComplete, isActive, isPending }: Props) {
  const cls = isComplete
    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
    : isActive
      ? "bg-sky-50 border-sky-300 text-sky-700 animate-pulse shadow-sm ring-1 ring-sky-300/30"
      : isPending
        ? "bg-white border-slate-200 text-slate-400 opacity-80"
        : "bg-white border-slate-200 text-slate-400 opacity-80";

  return (
    <div
      className={[
        "inline-flex items-center justify-center px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all",
        cls,
      ].join(" ")}
    >
      {label}
    </div>
  );
}
