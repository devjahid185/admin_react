import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  category_id: "",
  name: "",
  description: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  price_range: "",
  amenities: "",
  services: "",
  status: "active",
};

export default function HotelsPage({ token }) {
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
      const data = await apiRequest(`/admin/resources/hotels?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load hotels.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/hotel-categories", { token });
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

  const openEdit = (h) => {
    setMode("edit");
    setEditingId(h.id);
    setForm({
      user_id: h.user_id || "",
      category_id: h.category_id || "",
      name: h.name || "",
      description: h.description || "",
      address: h.address || "",
      phone: h.phone || "",
      email: h.email || "",
      website: h.website || "",
      price_range: h.price_range || "",
      amenities: Array.isArray(h.amenities) ? h.amenities.join(", ") : h.amenities || "",
      services: Array.isArray(h.services) ? h.services.join(", ") : h.services || "",
      status: h.status || "active",
    });
    setModalOpen(true);
  };

  const saveHotel = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      description: form.description || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      price_range: form.price_range || null,
      amenities: form.amenities ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      services: form.services ? form.services.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/hotels", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/hotels/${editingId}`, {
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

  const deleteHotel = async (id) => {
    await apiRequest(`/admin/resources/hotels/${id}`, { method: "DELETE", token });
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
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/hotels/${id}`, { method: "DELETE", token })));
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
          <Button onClick={openCreate}>Add Hotel</Button>
        </div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        deleting={bulkDeleting}
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-xs md:text-sm">
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
              <th className="text-left px-3 py-2 md:px-4">Phone</th>
              <th className="text-left px-3 py-2 md:px-4">Address</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((h) => (
              <tr key={h.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(h.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, h.id, e.target.checked))}
                    aria-label={`Select record ${h.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{h.id}</td>
                <td className="px-3 py-2 md:px-4">{h.name}</td>
                <td className="px-3 py-2 md:px-4">{h.category_id}</td>
                <td className="px-3 py-2 md:px-4">{h.phone || "-"}</td>
                <td className="px-3 py-2 md:px-4">{h.address || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(h)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteHotel(h.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={7}>
                  {loading ? "Loading..." : "No hotels found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Hotel" : "Edit Hotel"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-[#64748b]">Owner User ID</label>
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
                <label className="text-xs text-[#64748b]">Hotel Name</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <label className="text-xs text-[#64748b]">Website</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Price Range</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.price_range}
                  onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Amenities (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.amenities}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Services (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                />
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
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveHotel}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



