import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  name: "",
  operator_name: "",
  route_from: "",
  route_to: "",
  departure_terminal: "",
  arrival_terminal: "",
  departure_time: "",
  arrival_time: "",
  running_days: "Daily",
  deck_fare: "",
  chair_fare: "",
  single_cabin_fare: "",
  double_cabin_fare: "",
  has_cabin: false,
  has_ac: false,
  has_food: false,
  online_booking: false,
  phones: "",
  hotline: "",
  website: "",
  district: "Bhola",
  upazila: "",
  address: "",
  description: "",
  notes: "",
  status: "active",
};

export default function LaunchesPage({ token }) {
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
      const params = new URLSearchParams({ search, page: String(page), per_page: String(perPage) });
      const data = await apiRequest(`/admin/resources/launches?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load launch services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page, perPage, token]);

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
      name: r.name || "",
      operator_name: r.operator_name || "",
      route_from: r.route_from || "",
      route_to: r.route_to || "",
      departure_terminal: r.departure_terminal || "",
      arrival_terminal: r.arrival_terminal || "",
      departure_time: (r.departure_time || "").slice(0, 5),
      arrival_time: (r.arrival_time || "").slice(0, 5),
      running_days: r.running_days || "",
      deck_fare: r.deck_fare || "",
      chair_fare: r.chair_fare || "",
      single_cabin_fare: r.single_cabin_fare || "",
      double_cabin_fare: r.double_cabin_fare || "",
      has_cabin: Boolean(r.has_cabin),
      has_ac: Boolean(r.has_ac),
      has_food: Boolean(r.has_food),
      online_booking: Boolean(r.online_booking),
      phones: Array.isArray(r.phones) ? r.phones.join(", ") : r.phones || "",
      hotline: r.hotline || "",
      website: r.website || "",
      district: r.district || "",
      upazila: r.upazila || "",
      address: r.address || "",
      description: r.description || "",
      notes: r.notes || "",
      status: r.status || "active",
    });
    setModalOpen(true);
  };

  const saveLaunch = async () => {
    setError("");
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      name: form.name,
      operator_name: form.operator_name || null,
      route_from: form.route_from || null,
      route_to: form.route_to || null,
      departure_terminal: form.departure_terminal || null,
      arrival_terminal: form.arrival_terminal || null,
      departure_time: form.departure_time || null,
      arrival_time: form.arrival_time || null,
      running_days: form.running_days || null,
      deck_fare: form.deck_fare ? Number(form.deck_fare) : null,
      chair_fare: form.chair_fare ? Number(form.chair_fare) : null,
      single_cabin_fare: form.single_cabin_fare ? Number(form.single_cabin_fare) : null,
      double_cabin_fare: form.double_cabin_fare ? Number(form.double_cabin_fare) : null,
      has_cabin: form.has_cabin,
      has_ac: form.has_ac,
      has_food: form.has_food,
      online_booking: form.online_booking,
      phones: form.phones.split(",").map((v) => v.trim()).filter(Boolean),
      hotline: form.hotline || null,
      website: form.website || null,
      district: form.district || null,
      upazila: form.upazila || null,
      address: form.address || null,
      description: form.description || null,
      notes: form.notes || null,
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/launches", { method: "POST", token, body: payload });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/launches/${editingId}`, { method: "PUT", token, body: payload });
        setRecords((prev) => prev.map((r) => (r.id === editingId ? data.record : r)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteLaunch = async (id) => {
    if (!window.confirm("Delete this launch service?")) return;
    await apiRequest(`/admin/resources/launches/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => toggleSelectedId(prev, id, false));
  };

  const input = (key, label, type = "text", span = "") => (
    <div className={span}>
      <label className="text-xs text-[#64748b]">{label}</label>
      <input className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const check = (key, label) => (
    <label className="flex items-center gap-2 rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm text-[#24324a]">
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
      {label}
    </label>
  );


  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected records? This action cannot be undone.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/launches/${id}`, { method: "DELETE", token })));
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input placeholder="Search launch, route, hotline" className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="flex items-center gap-2"><span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span><Button onClick={openCreate}>Add Launch</Button></div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.size}
        deleting={bulkDeleting}
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[980px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]"><tr><th className="w-10 px-3 py-2"><input type="checkbox" checked={selectionState.allVisibleSelected} ref={(input) => { if (input) input.indeterminate = selectionState.someVisibleSelected; }} onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))} aria-label="Select all visible records" /></th><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Route</th><th className="px-3 py-2 text-left">Departure</th><th className="px-3 py-2 text-left">Hotline</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {records.map((r) => <tr key={r.id} className="border-t border-[#edf1f6]"><td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, r.id, e.target.checked))} aria-label={`Select record ${r.id}`} /></td><td className="px-3 py-2">{r.id}</td><td className="px-3 py-2 font-medium">{r.name}</td><td className="px-3 py-2">{r.route_from || "-"} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ {r.route_to || "-"}</td><td className="px-3 py-2">{r.departure_time || "-"}</td><td className="px-3 py-2">{r.hotline || "-"}</td><td className="px-3 py-2">{r.status}</td><td className="px-3 py-2 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => openEdit(r)}>Edit</Button><Button variant="ghost" onClick={() => deleteLaunch(r.id)}>Delete</Button></div></td></tr>)}
            {!records.length && <tr><td className="px-4 py-4 text-[#64748b]" colSpan={8}>{loading ? "Loading..." : "No launch services found."}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={(value) => { setPerPage(value); setPage(1); }} />
      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{mode === "create" ? "Add Launch Service" : "Edit Launch Service"}</h3><button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>Close</button></div><div className="mt-4 grid gap-3 md:grid-cols-2">{input("user_id", "Owner User ID")}{input("name", "Launch Name", "text", "md:col-span-2")}{input("operator_name", "Operator")}{input("running_days", "Running Days")}{input("route_from", "Route From")}{input("route_to", "Route To")}{input("departure_terminal", "Departure Terminal")}{input("arrival_terminal", "Arrival Terminal")}{input("departure_time", "Departure Time", "time")}{input("arrival_time", "Arrival Time", "time")}{input("deck_fare", "Deck Fare", "number")}{input("chair_fare", "Chair Fare", "number")}{input("single_cabin_fare", "Single Cabin Fare", "number")}{input("double_cabin_fare", "Double Cabin Fare", "number")}<div className="grid gap-2 md:col-span-2 md:grid-cols-4">{check("has_cabin", "Cabin")}{check("has_ac", "AC")}{check("has_food", "Food")}{check("online_booking", "Online booking")}</div>{input("phones", "Phones, comma separated")}{input("hotline", "Hotline")}{input("website", "Website")}{input("district", "District")}{input("upazila", "Upazila")}{input("address", "Address", "text", "md:col-span-2")}<div className="md:col-span-2"><label className="text-xs text-[#64748b]">Description</label><textarea className="mt-1 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="md:col-span-2"><label className="text-xs text-[#64748b]">Notes</label><textarea className="mt-1 min-h-20 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div><div><label className="text-xs text-[#64748b]">Status</label><select className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">active</option><option value="pending">pending</option><option value="inactive">inactive</option></select></div></div><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={saveLaunch}>Save</Button></div></div></div>}
    </div>
  );
}
