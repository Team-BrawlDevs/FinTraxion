type Props = {
  label: string;
  isComplete: boolean;
  isActive: boolean;
  isPending: boolean;
};

export default function AgentStep({ label, isComplete, isActive, isPending }: Props) {
  const cls = isComplete
    ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-200"
    : isActive
      ? "bg-sky-900/40 border-sky-400/60 text-sky-100 animate-pulse"
      : isPending
        ? "bg-slate-800/40 border-slate-700 text-slate-300"
        : "bg-slate-800/40 border-slate-700 text-slate-300";

  return (
    <div
      className={[
        "inline-flex items-center justify-center px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
        cls,
      ].join(" ")}
    >
      {label}
    </div>
  );
}

