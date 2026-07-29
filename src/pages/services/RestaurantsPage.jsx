import { useEffect, useState } from "react";
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
  cuisines: "",
  features: "",
  delivery_available: false,
  takeaway_available: false,
  dine_in_available: false,
  status: "active",
};

export default function RestaurantsPage({ token }) {
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
      const data = await apiRequest(`/admin/resources/restaurants?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/restaurant-categories", { token });
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

  const openEdit = (r) => {
    setMode("edit");
    setEditingId(r.id);
    setForm({
      user_id: r.user_id || "",
      category_id: r.category_id || "",
      name: r.name || "",
      description: r.description || "",
      address: r.address || "",
      phone: r.phone || "",
      email: r.email || "",
      website: r.website || "",
      price_range: r.price_range || "",
      cuisines: Array.isArray(r.cuisines) ? r.cuisines.join(", ") : r.cuisines || "",
      features: Array.isArray(r.features) ? r.features.join(", ") : r.features || "",
      delivery_available: Boolean(r.delivery_available),
      takeaway_available: Boolean(r.takeaway_available),
      dine_in_available: Boolean(r.dine_in_available),
      status: r.status || "active",
    });
    setModalOpen(true);
  };

  const saveRestaurant = async () => {
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
      cuisines: form.cuisines ? form.cuisines.split(",").map((s) => s.trim()).filter(Boolean) : [],
      features: form.features ? form.features.split(",").map((s) => s.trim()).filter(Boolean) : [],
      delivery_available: Boolean(form.delivery_available),
      takeaway_available: Boolean(form.takeaway_available),
      dine_in_available: Boolean(form.dine_in_available),
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/restaurants", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/restaurants/${editingId}`, {
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

  const deleteRestaurant = async (id) => {
    await apiRequest(`/admin/resources/restaurants/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by name or phone"
          className="w-full md:max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Restaurant</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[960px] w-full text-xs md:text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Name</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Phone</th>
              <th className="text-left px-3 py-2 md:px-4">Address</th>
              <th className="text-left px-3 py-2 md:px-4">Status</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 md:px-4">{r.id}</td>
                <td className="px-3 py-2 md:px-4">{r.name}</td>
                <td className="px-3 py-2 md:px-4">{r.category_id}</td>
                <td className="px-3 py-2 md:px-4">{r.phone || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.address || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.status}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteRestaurant(r.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  {loading ? "Loading..." : "No restaurants found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Restaurant" : "Edit Restaurant"}</h3>
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
                <label className="text-xs text-slate-500">Restaurant Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                <label className="text-xs text-slate-500">Address</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Phone</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Website</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price Range</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.price_range}
                  onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Cuisines (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.cuisines}
                  onChange={(e) => setForm({ ...form, cuisines: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Features (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.delivery_available}
                  onChange={(e) => setForm({ ...form, delivery_available: e.target.checked })}
                />
                <span className="text-sm">Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.takeaway_available}
                  onChange={(e) => setForm({ ...form, takeaway_available: e.target.checked })}
                />
                <span className="text-sm">Takeaway</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.dine_in_available}
                  onChange={(e) => setForm({ ...form, dine_in_available: e.target.checked })}
                />
                <span className="text-sm">Dine-in</span>
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
              <Button onClick={saveRestaurant}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


