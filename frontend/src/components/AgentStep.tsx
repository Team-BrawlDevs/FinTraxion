type Props = {
  label: string;
  isComplete: boolean;
  isActive: boolean;
  isPending: boolean;
};

export default function AgentStep({ label, isComplete, isActive, isPending }: Props) {
  const cls = isComplete
    ? "bg-success-light border-emerald-300 text-emerald-900"
    : isActive
      ? "bg-primary-light border-primary text-primary-dark animate-pulse shadow-sm"
      : isPending
        ? "bg-gray-50 border-edge text-muted"
        : "bg-gray-50 border-edge text-muted";

  return (
    <div
      className={[
        "inline-flex items-center justify-center px-4 py-2 rounded-md border text-sm font-semibold transition-all font-sans",
        cls,
      ].join(" ")}
    >
      {label}
    </div>
  );
}
