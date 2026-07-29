import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  category_id: "",
  title: "",
  type: "",
  price: 0,
  location: "",
  description: "",
  contact: "",
  amenities: "",
  furnished: false,
  parking: false,
  negotiable: false,
  status: "active",
};

export default function PropertyPage({ token }) {
  const [records, setRecords] = useState([]);
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
      const data = await apiRequest(`/admin/resources/property?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load properties.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/property-categories", { token });
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

  const openEdit = (p) => {
    setMode("edit");
    setEditingId(p.id);
    setForm({
      user_id: p.user_id || "",
      category_id: p.category_id || "",
      title: p.title || "",
      type: p.type || "",
      price: p.price ?? 0,
      location: p.location || "",
      description: p.description || "",
      contact: p.contact || "",
      amenities: Array.isArray(p.amenities) ? p.amenities.join(", ") : p.amenities || "",
      furnished: Boolean(p.furnished),
      parking: Boolean(p.parking),
      negotiable: Boolean(p.negotiable),
      status: p.status || "active",
    });
    setModalOpen(true);
  };

  const saveProperty = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      title: form.title,
      type: form.type || null,
      price: Number(form.price) || 0,
      location: form.location || null,
      description: form.description || null,
      contact: form.contact || null,
      amenities: form.amenities ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      furnished: Boolean(form.furnished),
      parking: Boolean(form.parking),
      negotiable: Boolean(form.negotiable),
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/property", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/property/${editingId}`, {
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

  const deleteProperty = async (id) => {
    await apiRequest(`/admin/resources/property/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by title or location"
          className="w-full md:max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Property</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[960px] w-full text-xs md:text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Title</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Type</th>
              <th className="text-left px-3 py-2 md:px-4">Price</th>
              <th className="text-left px-3 py-2 md:px-4">Location</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 md:px-4">{p.id}</td>
                <td className="px-3 py-2 md:px-4">{p.title}</td>
                <td className="px-3 py-2 md:px-4">{p.category_id}</td>
                <td className="px-3 py-2 md:px-4">{p.type || "-"}</td>
                <td className="px-3 py-2 md:px-4">{p.price}</td>
                <td className="px-3 py-2 md:px-4">{p.location || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteProperty(p.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  {loading ? "Loading..." : "No properties found."}
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
          <div className="w-full max-w-4xl rounded-md bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Property" : "Edit Property"}</h3>
              <button className="text-sm text-slate-500" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Owner User ID</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Category</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                <label className="text-xs text-slate-500">Title</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Type</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Location</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Contact</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Amenities (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.amenities}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.furnished}
                  onChange={(e) => setForm({ ...form, furnished: e.target.checked })}
                />
                <span className="text-sm">Furnished</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.parking}
                  onChange={(e) => setForm({ ...form, parking: e.target.checked })}
                />
                <span className="text-sm">Parking</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.negotiable}
                  onChange={(e) => setForm({ ...form, negotiable: e.target.checked })}
                />
                <span className="text-sm">Negotiable</span>
              </div>
              <div>
                <label className="text-xs text-slate-500">Status</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              <Button onClick={saveProperty}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


