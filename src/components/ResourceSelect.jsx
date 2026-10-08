import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

function defaultLabel(item) {
  if (!item) return "";
  const title =
    item.name ||
    item.title ||
    item.code ||
    item.order_no ||
    item.brand_name ||
    item.receiver_name ||
    `#${item.id}`;
  const meta = [
    item.phone,
    item.email,
    item.category_name,
    item.restaurant?.name,
    item.status,
  ].filter(Boolean);
  return meta.length ? `${title} (${meta.join(" / ")})` : `${title} (#${item.id})`;
}

export default function ResourceSelect({
  token,
  resource,
  label,
  value,
  onChange,
  placeholder = "Search by name or ID",
  required = false,
  error = "",
  formatLabel = defaultLabel,
  selectedFallback,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const selectedId = value ? String(value) : "";
  const displayText = useMemo(
    () => (selected ? formatLabel(selected) : selectedId ? selectedFallback?.(selectedId) || `#${selectedId}` : ""),
    [formatLabel, selected, selectedFallback, selectedId],
  );

  useEffect(() => {
    let active = true;
    if (!selectedId) {
      setSelected(null);
      return;
    }
    if (selected && String(selected.id) === selectedId) return;

    apiRequest(`/admin/resources/${resource}/${selectedId}`, { token })
      .then((item) => {
        if (active) setSelected(item);
      })
      .catch(() => {
        if (active) setSelected(null);
      });

    return () => {
      active = false;
    };
  }, [resource, selectedId, token]);

  useEffect(() => {
    let active = true;
    const trimmed = query.trim();
    if (!open && trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ per_page: "12" });
        if (trimmed.length >= 2) params.set("search", trimmed);
        const data = await apiRequest(`/admin/resources/${resource}?${params.toString()}`, { token });
        if (active) setResults(data?.data || []);
      } catch (_) {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query, resource, token]);

  const choose = (item) => {
    setSelected(item);
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange?.(item ? String(item.id) : "");
  };

  return (
    <div className="relative">
      <label className="text-xs text-[#64748b]">
        {label}
        {required ? <span className="text-[#ee0012]"> *</span> : null}
      </label>

      {selectedId ? (
        <div className="mt-1 flex min-h-[40px] items-center gap-2 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-sm">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#ee0012]/10 text-xs font-black text-[#ee0012]">
            #{selectedId}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[#101827]">{displayText}</p>
            <p className="text-[11px] text-[#64748b]">Selected ID: {selectedId}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#dfe6ef] px-2.5 py-1 text-xs font-semibold text-[#64748b] hover:border-[#ee0012]/30 hover:text-[#ee0012]"
            onClick={() => choose(null)}
          >
            Clear
          </button>
        </div>
      ) : null}

      <input
        className="mt-2 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
        value={query}
        placeholder={selectedId ? "Search to replace selection" : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      {open ? (
        <div className="absolute z-[70] mt-2 max-h-72 w-full overflow-y-auto rounded-[14px] border border-[#dfe6ef] bg-white p-1 shadow-xl shadow-slate-900/12">
          {loading ? <div className="px-3 py-2 text-sm text-[#64748b]">Loading options...</div> : null}
          {!loading && results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#64748b]">
              {query.trim().length >= 2 ? "No matching record found." : "No records found."}
            </div>
          ) : null}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left hover:bg-red-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#101827] text-xs font-black text-white">
                {item.id}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#101827]">
                  {formatLabel(item)}
                </span>
                <span className="block truncate text-xs text-[#64748b]">
                  ID #{item.id}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
