import { useCallback, useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { apiRequest } from "../../lib/api.js";
import { connectAdminLive } from "../../lib/adminLive.js";

const REQUEST_TYPES = {
  "teacher-requests": {
    label: "Teacher Requests",
    singular: "Teacher request",
    amountKey: "budget",
    amountLabel: "Budget",
  },
  "student-requests": {
    label: "Student Requests",
    singular: "Student request",
    amountKey: "fee",
    amountLabel: "Expected fee",
  },
};

function displayDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#8390a4]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#182235]">{value || "-"}</p>
    </div>
  );
}

export default function EducationRequestsPanel({ token, onShowInstitutes }) {
  const [resource, setResource] = useState("teacher-requests");
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [counts, setCounts] = useState({ "teacher-requests": 0, "student-requests": 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      const [teacher, student] = await Promise.all(
        Object.keys(REQUEST_TYPES).map((key) =>
          apiRequest(`/admin/resources/${key}?per_page=1`, { token }),
        ),
      );
      setCounts({
        "teacher-requests": teacher.meta?.total || 0,
        "student-requests": student.meta?.total || 0,
      });
    } catch (_) {}
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const data = await apiRequest(`/admin/resources/${resource}?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Education requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, resource, search, status, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(
    () => connectAdminLive({
      token,
      onUpdate: ({ modules = [] }) => {
        if (!modules.includes("education")) return;
        load();
        loadCounts();
      },
    }),
    [load, loadCounts, token],
  );

  const changeResource = (next) => {
    setResource(next);
    setPage(1);
    setSelected(null);
  };

  const updateStatus = async (record, nextStatus) => {
    setSavingId(record.id);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/${resource}/${record.id}`, {
        method: "PUT",
        token,
        body: { status: nextStatus },
      });
      const updated = { ...record, ...data.record };
      setRecords((current) => current.map((item) => (item.id === record.id ? updated : item)));
      if (selected?.id === record.id) setSelected(updated);
    } catch (err) {
      setError(err.message || "Status could not be updated.");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete request #${record.id}?`)) return;
    setSavingId(record.id);
    try {
      await apiRequest(`/admin/resources/${resource}/${record.id}`, { method: "DELETE", token });
      setSelected(null);
      await Promise.all([load(), loadCounts()]);
    } catch (err) {
      setError(err.message || "Request could not be deleted.");
    } finally {
      setSavingId(null);
    }
  };

  const config = REQUEST_TYPES[resource];
  const amount = selected?.[config.amountKey];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-[#dfe6ef] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#101827]">Education request inbox</h2>
          <p className="mt-1 text-sm text-[#64748b]">Review teacher and student requests submitted from the app.</p>
        </div>
        <Button variant="ghost" onClick={onShowInstitutes}>Education Institutes</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#dfe6ef] pb-3">
        {Object.entries(REQUEST_TYPES).map(([key, item]) => (
          <button
            key={key}
            type="button"
            onClick={() => changeResource(key)}
            className={`whitespace-nowrap rounded-[8px] border px-3 py-2 text-sm font-bold transition ${
              resource === key
                ? "border-[#ee0012] bg-red-50 text-[#c70010]"
                : "border-[#dfe6ef] bg-white text-[#53637a] hover:border-red-200"
            }`}
          >
            {item.label} ({counts[key] || 0})
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search title, phone, address or district"
          className="w-full rounded-[8px] border border-[#dfe6ef] px-3 py-2.5 text-sm outline-none focus:border-red-300"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-[8px] border border-[#dfe6ef] bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto border border-[#dfe6ef] bg-white">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-4 py-3 text-left">Request</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Study details</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[#edf1f6] align-top hover:bg-[#fbfcfe]">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setSelected(record)} className="text-left font-bold text-[#172033] hover:text-red-700">
                    #{record.id} {record.title}
                  </button>
                  <p className="mt-1 text-xs text-[#8390a4]">{displayDate(record.created_at)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#26344d]">{record.user?.name || "App user"}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{record.phone || record.user?.phone || "-"}</p>
                </td>
                <td className="px-4 py-3 text-[#53637a]">
                  <p>{record.class_level || "Class not specified"}</p>
                  <p className="mt-1 text-xs">{[record.medium, record.mode].filter(Boolean).join(" • ") || "-"}</p>
                </td>
                <td className="px-4 py-3 text-[#53637a]">{[record.address, record.upazila, record.district].filter(Boolean).join(", ") || "-"}</td>
                <td className="px-4 py-3"><StatusBadge value={record.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setSelected(record)}>View details</Button>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#64748b]">{loading ? "Loading requests..." : "No requests found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={(value) => { setPerPage(value); setPage(1); }} />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={`${config.singular} details`}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#dfe6ef] bg-white p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] pb-4">
              <div>
                <div className="flex items-center gap-2"><StatusBadge value={selected.status} /><span className="text-xs font-bold text-[#8390a4]">REQUEST #{selected.id}</span></div>
                <h3 className="mt-2 text-xl font-black text-[#101827]">{selected.title}</h3>
                <p className="mt-1 text-xs text-[#64748b]">Submitted {displayDate(selected.created_at)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-sm font-bold text-[#64748b] hover:text-[#101827]">Close</button>
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
              <Detail label="Submitted by" value={selected.user?.name || `User #${selected.user_id}`} />
              <Detail label="Phone" value={selected.phone || selected.user?.phone} />
              <Detail label="Category" value={selected.category?.name || `Category #${selected.category_id || "-"}`} />
              <Detail label="Class / level" value={selected.class_level} />
              <Detail label="Medium" value={selected.medium} />
              <Detail label="Mode" value={selected.mode} />
              <Detail label="Days per week" value={selected.days_per_week} />
              <Detail label={config.amountLabel} value={amount == null ? "-" : `BDT ${Number(amount).toLocaleString("en-BD")}`} />
              <Detail label="Full address" value={[selected.address, selected.upazila, selected.district].filter(Boolean).join(", ")} wide />
              <Detail label="Notes" value={selected.notes} wide />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#edf1f6] pt-4 sm:flex-row sm:justify-between">
              <Button variant="ghost" disabled={savingId === selected.id} onClick={() => remove(selected)}>Delete request</Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                <Button disabled={savingId === selected.id} onClick={() => updateStatus(selected, selected.status === "closed" ? "open" : "closed")}>
                  {savingId === selected.id ? "Saving..." : selected.status === "closed" ? "Reopen request" : "Mark as closed"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
