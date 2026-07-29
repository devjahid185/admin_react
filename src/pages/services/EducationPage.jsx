import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  category_id: "",
  name: "",
  type: "",
  phone: "",
  email: "",
  district: "",
  upazila: "",
  address: "",
  levels: "",
  mediums: "",
  facilities: "",
  status: "active",
};

export default function EducationPage({ token }) {
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
      const data = await apiRequest(`/admin/resources/education?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load education institutes.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/education-categories", { token });
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

  const openEdit = (e) => {
    setMode("edit");
    setEditingId(e.id);
    setForm({
      user_id: e.user_id || "",
      category_id: e.category_id || "",
      name: e.name || "",
      type: e.type || "",
      phone: e.phone || "",
      email: e.email || "",
      district: e.district || "",
      upazila: e.upazila || "",
      address: e.address || "",
      levels: Array.isArray(e.levels) ? e.levels.join(", ") : e.levels || "",
      mediums: Array.isArray(e.mediums) ? e.mediums.join(", ") : e.mediums || "",
      facilities: Array.isArray(e.facilities) ? e.facilities.join(", ") : e.facilities || "",
      status: e.status || "active",
    });
    setModalOpen(true);
  };

  const saveInstitute = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      type: form.type || null,
      phone: form.phone || null,
      email: form.email || null,
      district: form.district || null,
      upazila: form.upazila || null,
      address: form.address || null,
      levels: form.levels ? form.levels.split(",").map((s) => s.trim()).filter(Boolean) : [],
      mediums: form.mediums ? form.mediums.split(",").map((s) => s.trim()).filter(Boolean) : [],
      facilities: form.facilities ? form.facilities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/education", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/education/${editingId}`, {
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

  const deleteInstitute = async (id) => {
    await apiRequest(`/admin/resources/education/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by name or district"
          className="w-full md:max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Institute</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[980px] w-full text-xs md:text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Name</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Type</th>
              <th className="text-left px-3 py-2 md:px-4">Phone</th>
              <th className="text-left px-3 py-2 md:px-4">District</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 md:px-4">{e.id}</td>
                <td className="px-3 py-2 md:px-4">{e.name}</td>
                <td className="px-3 py-2 md:px-4">{e.category_id}</td>
                <td className="px-3 py-2 md:px-4">{e.type || "-"}</td>
                <td className="px-3 py-2 md:px-4">{e.phone || "-"}</td>
                <td className="px-3 py-2 md:px-4">{e.district || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(e)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteInstitute(e.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  {loading ? "Loading..." : "No institutes found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Institute" : "Edit Institute"}</h3>
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
                <label className="text-xs text-slate-500">Institute Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                <label className="text-xs text-slate-500">District</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Upazila</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.upazila}
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })}
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
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Levels (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.levels}
                  onChange={(e) => setForm({ ...form, levels: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Mediums (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.mediums}
                  onChange={(e) => setForm({ ...form, mediums: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Facilities (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.facilities}
                  onChange={(e) => setForm({ ...form, facilities: e.target.value })}
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
              <Button onClick={saveInstitute}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


