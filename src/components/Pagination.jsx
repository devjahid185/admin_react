export default function Pagination({
  meta,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  showTotal = true,
}) {
  if (!meta) return null;
  const total = meta.total ?? 0;
  const currentPage = meta.current_page ?? page ?? 1;
  const lastPage = meta.last_page ?? 1;
  const safeLastPage = lastPage < 1 ? 1 : lastPage;
  const canPrev = currentPage > 1;
  const canNext = currentPage < safeLastPage;
  const options = [10, 20, 50, 100];

  const buttonClass =
    "rounded-[12px] border border-[#dfe6ef] bg-white px-3 py-1.5 text-sm font-semibold text-[#24324a] shadow-sm transition hover:border-red-200 hover:text-[#ee0012] disabled:opacity-40 disabled:hover:text-[#24324a]";

  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-[#dfe6ef] bg-white px-4 py-3 text-xs font-medium text-[#64748b] shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <button className={buttonClass} onClick={() => canPrev && onPageChange?.(currentPage - 1)} disabled={!canPrev}>
          Prev
        </button>
        <span className="rounded-[12px] bg-[#f8fafc] px-3 py-1.5">
          Page {currentPage} of {safeLastPage}
        </span>
        <button className={buttonClass} onClick={() => canNext && onPageChange?.(currentPage + 1)} disabled={!canNext}>
          Next
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="rounded-[12px] border border-[#dfe6ef] px-2 py-1.5 text-sm"
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        {showTotal && <span className="rounded-[12px] bg-red-50 px-3 py-1.5 font-semibold text-[#ee0012]">Total: {total}</span>}
      </div>
    </div>
  );
}
