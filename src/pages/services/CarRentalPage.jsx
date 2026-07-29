import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  category_id: "",
  title: "",
  brand: "",
  model: "",
  year: "",
  seat_count: "",
  price_per_day: "",
  location: "",
  contact_phone: "",
  status: "active",
};

export default function CarRentalPage({ token }) {
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/car-rental?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load car rentals.");
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

  const openEdit = (r) => {
    setMode("edit");
    setEditingId(r.id);
    setForm({
      user_id: r.user_id || "",
      category_id: r.category_id || "",
      title: r.title || "",
      brand: r.brand || "",
      model: r.model || "",
      year: r.year || "",
      seat_count: r.seat_count || "",
      price_per_day: r.price_per_day || "",
      location: r.location || "",
      contact_phone: r.contact_phone || "",
      status: r.status || "active",
    });
    setModalOpen(true);
  };

  const saveRental = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      title: form.title,
      brand: form.brand || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      seat_count: form.seat_count ? Number(form.seat_count) : null,
      price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
      location: form.location || null,
      contact_phone: form.contact_phone || null,
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/car-rental", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/car-rental/${editingId}`, {
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

  const deleteRental = async (id) => {
    await apiRequest(`/admin/resources/car-rental/${id}`, { method: "DELETE", token });
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
          <Button onClick={openCreate}>Add Rental</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[940px] w-full text-xs md:text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Title</th>
              <th className="text-left px-3 py-2 md:px-4">Brand</th>
              <th className="text-left px-3 py-2 md:px-4">Model</th>
              <th className="text-left px-3 py-2 md:px-4">Price/Day</th>
              <th className="text-left px-3 py-2 md:px-4">Location</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 md:px-4">{r.id}</td>
                <td className="px-3 py-2 md:px-4">{r.title}</td>
                <td className="px-3 py-2 md:px-4">{r.brand || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.model || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.price_per_day || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.location || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteRental(r.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  {loading ? "Loading..." : "No rentals found."}
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
          <div className="w-full max-w-3xl rounded-md bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Car Rental" : "Edit Car Rental"}</h3>
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
                <label className="text-xs text-slate-500">Category ID</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                />
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
                <label className="text-xs text-slate-500">Brand</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Model</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Year</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Seat Count</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.seat_count}
                  onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price per Day</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.price_per_day}
                  onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
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
                <label className="text-xs text-slate-500">Contact Phone</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
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
              <Button onClick={saveRental}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


