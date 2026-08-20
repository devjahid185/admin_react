import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  category_id: "",
  name: "",
  title: "",
  specialization: "",
  hospital: "",
  clinic: "",
  experience_years: 0,
  degrees: "",
  bmdc_number: "",
  fees: 0,
  phone: "",
  email: "",
  district: "",
  upazila: "",
  address: "",
  chamber_time: "",
  about: "",
  is_available: true,
  status: "active",
};

export default function DoctorsPage({ token }) {
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
  const [categories, setCategories] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/doctors?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/doctor-categories", { token });
      setCategories(data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    load();
  }, [search, page, perPage, token]);

  useEffect(() => {
    loadCategories();
  }, [token]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setMode("edit");
    setEditingId(doc.id);
    setForm({
      user_id: doc.user_id || "",
      category_id: doc.category_id || "",
      name: doc.name || "",
      title: doc.title || "",
      specialization: doc.specialization || "",
      hospital: doc.hospital || "",
      clinic: doc.clinic || "",
      experience_years: doc.experience_years ?? 0,
      degrees: doc.degrees || "",
      bmdc_number: doc.bmdc_number || "",
      fees: doc.fees ?? 0,
      phone: doc.phone || "",
      email: doc.email || "",
      district: doc.district || "",
      upazila: doc.upazila || "",
      address: doc.address || "",
      chamber_time: doc.chamber_time || "",
      about: doc.about || "",
      is_available: Boolean(doc.is_available),
      status: doc.status || "active",
    });
    setModalOpen(true);
  };

  const saveDoctor = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      title: form.title || null,
      specialization: form.specialization || null,
      hospital: form.hospital || null,
      clinic: form.clinic || null,
      experience_years: Number(form.experience_years) || 0,
      degrees: form.degrees || null,
      bmdc_number: form.bmdc_number || null,
      fees: Number(form.fees) || 0,
      phone: form.phone || null,
      email: form.email || null,
      district: form.district || null,
      upazila: form.upazila || null,
      address: form.address || null,
      chamber_time: form.chamber_time || null,
      about: form.about || null,
      is_available: Boolean(form.is_available),
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/doctors", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/doctors/${editingId}`, {
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

  const deleteDoctor = async (id) => {
    await apiRequest(`/admin/resources/doctors/${id}`, { method: "DELETE", token });
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
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/doctors/${id}`, { method: "DELETE", token })));
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
          placeholder="Search by name or phone"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Doctor</Button>
        </div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        deleting={bulkDeleting}
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[980px] w-full text-xs md:text-sm">
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
              <th className="text-left px-3 py-2 md:px-4">Name</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Specialization</th>
              <th className="text-left px-3 py-2 md:px-4">Hospital</th>
              <th className="text-left px-3 py-2 md:px-4">Fees</th>
              <th className="text-left px-3 py-2 md:px-4">Availability</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((d) => (
              <tr key={d.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(d.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, d.id, e.target.checked))}
                    aria-label={`Select record ${d.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{d.id}</td>
                <td className="px-3 py-2 md:px-4">{d.name}</td>
                <td className="px-3 py-2 md:px-4">{d.category_id}</td>
                <td className="px-3 py-2 md:px-4">{d.specialization || "-"}</td>
                <td className="px-3 py-2 md:px-4">{d.hospital || "-"}</td>
                <td className="px-3 py-2 md:px-4">{d.fees}</td>
                <td className="px-3 py-2 md:px-4">{d.is_available ? "Yes" : "No"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(d)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteDoctor(d.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={9}>
                  {loading ? "Loading..." : "No doctors found."}
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
          <div className="w-full max-w-4xl rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Doctor" : "Edit Doctor"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-[#64748b]">User ID</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Category</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Name</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Title</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Specialization</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Hospital</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Clinic</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.clinic}
                  onChange={(e) => setForm({ ...form, clinic: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Experience Years</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Fees</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.fees}
                  onChange={(e) => setForm({ ...form, fees: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Phone</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Email</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">District</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Upazila</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.upazila}
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Address</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Chamber Time</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.chamber_time}
                  onChange={(e) => setForm({ ...form, chamber_time: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Availability</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.is_available ? "1" : "0"}
                  onChange={(e) => setForm({ ...form, is_available: e.target.value === "1" })}
                >
                  <option value="1">Available</option>
                  <option value="0">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Status</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">About</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveDoctor}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



