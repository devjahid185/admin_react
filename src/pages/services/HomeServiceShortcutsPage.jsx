import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  title: "",
  subtitle: "",
  endpoint: "",
  icon: "",
  accent_color: "#E91E63",
  sort_order: "0",
  is_active: true,
};

export default function HomeServiceShortcutsPage({ token }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, per_page: "100" });
      const data = await apiRequest(`/admin/home-service-shortcuts?${params.toString()}`, { token });
      setRecords(data.data || []);
    } catch (err) {
      setError(err.message || "Unable to load shortcuts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, token]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      title: record.title || "",
      subtitle: record.subtitle || "",
      endpoint: record.endpoint || "",
      icon: record.icon || "",
      accent_color: record.accent_color || "#E91E63",
      sort_order: String(record.sort_order ?? 0),
      is_active: Boolean(record.is_active),
    });
    setModalOpen(true);
  };

  const saveRecord = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        endpoint: form.endpoint.trim(),
        icon: form.icon.trim() || null,
        accent_color: form.accent_color.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_active: Boolean(form.is_active),
      };
      const res = editingId
        ? await apiRequest(`/admin/home-service-shortcuts/${editingId}`, { method: "PUT", token, body: payload })
        : await apiRequest("/admin/home-service-shortcuts", { method: "POST", token, body: payload });

      setStatus(res.message || "Shortcut saved.");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (record, updates) => {
    const payload = {
      title: record.title,
      subtitle: record.subtitle || null,
      endpoint: record.endpoint,
      icon: record.icon || null,
      accent_color: record.accent_color || null,
      sort_order: Number(record.sort_order || 0),
      is_active: Boolean(record.is_active),
      ...updates,
    };
    await apiRequest(`/admin/home-service-shortcuts/${record.id}`, { method: "PUT", token, body: payload });
    await load();
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete "${record.title}" shortcut?`)) return;
    await apiRequest(`/admin/home-service-shortcuts/${record.id}`, { method: "DELETE", token });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#ee0012]">Mobile homepage</p>
            <h2 className="mt-1 text-xl font-bold text-[#101827]">Home service order</h2>
            <p className="mt-1 text-sm text-[#64748b]">Control mobile app shortcut serial, visibility, title and icon label.</p>
          </div>
          <Button onClick={openCreate}>Add Shortcut</Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm md:max-w-sm"
            placeholder="Search title or endpoint"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs font-medium text-[#64748b]">{records.length} shortcuts</span>
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {status && <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>}

      <div className="overflow-x-auto rounded-[18px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-[#f8fafc] text-left text-xs uppercase tracking-[0.14em] text-[#64748b]">
            <tr>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Shortcut</th>
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[#edf1f6]">
                <td className="px-4 py-3">
                  <input
                    className="w-24 rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm font-semibold"
                    type="number"
                    value={record.sort_order ?? 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRecords((prev) => prev.map((item) => (item.id === record.id ? { ...item, sort_order: value } : item)));
                    }}
                    onBlur={(e) => quickUpdate(record, { sort_order: Number(e.target.value || 0) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: record.accent_color || "#E91E63" }}
                    >
                      {(record.icon || record.title || "S").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#101827]">{record.title}</p>
                      <p className="truncate text-xs text-[#64748b]">{record.subtitle || "No subtitle"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#53637a]">{record.endpoint}</td>
                <td className="px-4 py-3 text-[#53637a]">{record.icon || "-"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => quickUpdate(record, { is_active: !record.is_active })}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${record.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {record.is_active ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(record)}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove(record)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-5 text-[#64748b]" colSpan={6}>
                  {loading ? "Loading shortcuts..." : "No shortcuts found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#101827]">{editingId ? "Edit Shortcut" : "Add Shortcut"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Field label="Subtitle" value={form.subtitle} onChange={(value) => setForm({ ...form, subtitle: value })} />
              <Field label="Endpoint" value={form.endpoint} onChange={(value) => setForm({ ...form, endpoint: value })} />
              <Field label="Icon key" value={form.icon} onChange={(value) => setForm({ ...form, icon: value })} />
              <Field label="Accent color" type="color" value={form.accent_color} onChange={(value) => setForm({ ...form, accent_color: value })} />
              <Field label="Serial" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: value })} />
              <label className="flex items-center gap-2 rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm font-semibold text-[#24324a]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active on app home
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={saveRecord} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm font-semibold text-[#24324a]">
      {label}
      <input
        className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm font-normal text-[#101827]"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
