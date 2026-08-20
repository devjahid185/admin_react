import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  posted_by: "",
  title: "",
  company: "",
  description: "",
  salary: "",
  location: "",
  type: "",
  contact: "",
};

export default function JobsPage({ token }) {
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/jobs?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, page, perPage, token]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (j) => {
    setMode("edit");
    setEditingId(j.id);
    setForm({
      posted_by: j.posted_by || "",
      title: j.title || "",
      company: j.company || "",
      description: j.description || "",
      salary: j.salary || "",
      location: j.location || "",
      type: j.type || "",
      contact: j.contact || "",
    });
    setModalOpen(true);
  };

  const saveJob = async () => {
    setError("");
    const payload = {
      posted_by: form.posted_by ? Number(form.posted_by) : null,
      title: form.title,
      company: form.company,
      description: form.description,
      salary: form.salary || null,
      location: form.location || null,
      type: form.type || null,
      contact: form.contact || null,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/jobs", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/jobs/${editingId}`, {
          method: "PUT",
          token,
          body: payload,
        });
        setRecords((prev) => prev.map((r) => (r.id === editingId ? data.record : r)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteJob = async (id) => {
    await apiRequest(`/admin/resources/jobs/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => toggleSelectedId(prev, id, false));
  };


  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected records? This action cannot be undone.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/jobs/${id}`, { method: "DELETE", token })));
      setRecords((prev) => prev.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Bulk delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const selectionState = visibleSelectionState(records, selectedIds);
  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by title or company"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Job</Button>
        </div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        deleting={bulkDeleting}
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[940px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]">
            <tr>
              <th className="w-10 px-3 py-2 md:px-4">
                <input
                  type="checkbox"
                  checked={selectionState.allVisibleSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = selectionState.someVisibleSelected;
                  }}
                  onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                  aria-label="Select all visible records"
                />
              </th>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Title</th>
              <th className="text-left px-3 py-2 md:px-4">Company</th>
              <th className="text-left px-3 py-2 md:px-4">Salary</th>
              <th className="text-left px-3 py-2 md:px-4">Location</th>
              <th className="text-left px-3 py-2 md:px-4">Type</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((j) => (
              <tr key={j.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(j.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, j.id, e.target.checked))}
                    aria-label={`Select record ${j.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{j.id}</td>
                <td className="px-3 py-2 md:px-4">{j.title}</td>
                <td className="px-3 py-2 md:px-4">{j.company}</td>
                <td className="px-3 py-2 md:px-4">{j.salary || "-"}</td>
                <td className="px-3 py-2 md:px-4">{j.location || "-"}</td>
                <td className="px-3 py-2 md:px-4">{j.type || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(j)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteJob(j.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={8}>
                  {loading ? "Loading..." : "No jobs found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        meta={meta}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(value) => {
          setPerPage(value);
          setPage(1);
        }}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Job" : "Edit Job"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-[#64748b]">Posted By (User ID)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.posted_by}
                  onChange={(e) => setForm({ ...form, posted_by: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Company</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Job Title</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Description</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Salary</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Location</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Type</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Contact</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveJob}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



