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

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
          onClick={() => canPrev && onPageChange?.(currentPage - 1)}
          disabled={!canPrev}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {safeLastPage}
        </span>
        <button
          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
          onClick={() => canNext && onPageChange?.(currentPage + 1)}
          disabled={!canNext}
        >
          Next
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
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
        {showTotal && <span>Total: {total}</span>}
      </div>
    </div>
  );
}


