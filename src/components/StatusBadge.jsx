export default function StatusBadge({ value }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    reviewed: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blocked: "bg-rose-50 text-rose-700 border-rose-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const cls = map[value] || "bg-[#f8fafc] text-[#53637a] border-[#dfe6ef]";
  return (
    <span className={`inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      {value || "-"}
    </span>
  );
}
