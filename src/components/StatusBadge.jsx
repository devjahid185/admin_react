export default function StatusBadge({ value }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    reviewed: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    active: "bg-emerald-100 text-emerald-700",
    blocked: "bg-rose-100 text-rose-700",
  };
  const cls = map[value] || "bg-slate-100 text-slate-600";
  return <span className={`px-2 py-1 rounded-md text-xs ${cls}`}>{value || "-"}</span>;
}


