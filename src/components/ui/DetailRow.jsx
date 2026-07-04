export default function DetailRow({ label, value, layout = "stacked", mono, capitalize }) {
  if (layout === "side-by-side") {
    return (
      <div className="flex justify-between items-center">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <span className={`text-sm font-medium text-on-surface ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}>
          {value}
        </span>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-on-surface font-medium">{value}</p>
    </div>
  );
}
