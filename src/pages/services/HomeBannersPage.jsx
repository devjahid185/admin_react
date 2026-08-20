import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const emptyForm = {
  title: "",
  subtitle: "",
  details: "",
  link_url: "",
  button_text: "",
  sort_order: "0",
  is_active: true,
  starts_at: "",
  ends_at: "",
};

export default function HomeBannersPage({ token }) {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, page: String(page), per_page: String(perPage) });
      const data = await apiRequest(`/admin/home-banners?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, page, perPage, token]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      title: record.title || "",
      subtitle: record.subtitle || "",
      details: record.details || "",
      link_url: record.link_url || "",
      button_text: record.button_text || "",
      sort_order: String(record.sort_order ?? 0),
      is_active: Boolean(record.is_active),
      starts_at: record.starts_at ? String(record.starts_at).slice(0, 16) : "",
      ends_at: record.ends_at ? String(record.ends_at).slice(0, 16) : "",
    });
    setImageFile(null);
    setImagePreview(record.image_url || "");
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        details: form.details.trim() || null,
        link_url: form.link_url.trim() || null,
        button_text: form.button_text.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_active: Boolean(form.is_active),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };

      const res = editingId
        ? await apiRequest(`/admin/home-banners/${editingId}`, { method: "PUT", token, body: payload })
        : await apiRequest("/admin/home-banners", { method: "POST", token, body: payload });

      const record = res.record;
      if (imageFile && record?.id) {
        const media = new FormData();
        media.append("section", "home");
        media.append("target_type", "home_banner");
        media.append("target_id", String(record.id));
        media.append("set_primary", "true");
        media.append("images[]", imageFile);
        await apiUpload("/media/upload", { token, formData: media });
      }

      setStatus(res.message || "Banner saved.");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete "${record.title}" banner?`)) return;
    await apiRequest(`/admin/home-banners/${record.id}`, { method: "DELETE", token });
    setSelectedIds((prev) => prev.filter((id) => id !== record.id));
    await load();
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected banner${selectedIds.length > 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    setError("");
    setStatus("");
    try {
      await Promise.all(selectedIds.map((id) => apiRequest(`/admin/home-banners/${id}`, { method: "DELETE", token })));
      setStatus(`${selectedIds.length} banner${selectedIds.length > 1 ? "s" : ""} deleted.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.message || "Bulk delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggle = async (record) => {
    const payload = { ...record, is_active: !record.is_active };
    delete payload.image_url;
    await apiRequest(`/admin/home-banners/${record.id}`, { method: "PUT", token, body: payload });
    await load();
  };

  const handleImage = (file) => {
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#ee0012]">Homepage promotion</p>
            <h2 className="mt-1 text-xl font-bold text-[#101827]">Home banners</h2>
            <p className="mt-1 text-sm text-[#64748b]">Create up to six active promotional slides for the mobile app homepage.</p>
          </div>
          <Button onClick={openCreate}>Add Banner</Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm md:max-w-sm"
            placeholder="Search title or subtitle"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-xs font-medium text-[#64748b]">{meta?.total || records.length} banners</span>
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {status && <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>}

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        totalCount={records.length}
        noun="banner"
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
        deleting={bulkDeleting}
      />

      {!!records.length && (
        <label className="inline-flex items-center gap-2 rounded-[14px] border border-[#dfe6ef] bg-white px-4 py-2 text-xs font-bold text-[#53637a] shadow-sm">
          <input
            type="checkbox"
            checked={records.every((record) => selectedIds.includes(record.id))}
            ref={(node) => {
              if (node) node.indeterminate = records.some((record) => selectedIds.includes(record.id)) && !records.every((record) => selectedIds.includes(record.id));
            }}
            onChange={() => setSelectedIds((prev) => toggleVisibleIds(prev, records))}
          />
          Select visible banners
        </label>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((record) => (
          <div key={record.id} className={`overflow-hidden rounded-[18px] border bg-white shadow-sm transition ${selectedIds.includes(record.id) ? "border-[#ee0012] ring-2 ring-red-100" : "border-[#dfe6ef]"}`}>
            <div className="h-36 bg-[#f8fafc]">
              {record.image_url ? (
                <img src={record.image_url} alt={record.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8b98ab]">No image</div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.includes(record.id)}
                  onChange={() => setSelectedIds((prev) => toggleSelectedId(prev, record.id))}
                  aria-label={`Select ${record.title}`}
                />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-[#101827]">{record.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{record.subtitle || record.details || "No details"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${record.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {record.is_active ? "Active" : "Off"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => openEdit(record)}>Edit</Button>
                <Button variant="ghost" onClick={() => toggle(record)}>{record.is_active ? "Turn Off" : "Turn On"}</Button>
                <Button variant="ghost" onClick={() => remove(record)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
        {!records.length && (
          <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b]">
            {loading ? "Loading banners..." : "No banners found."}
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#101827]">{editingId ? "Edit Banner" : "Add Banner"}</h3>
                <p className="text-xs text-[#64748b]">Recommended image ratio: wide banner, 1200 x 520 or similar.</p>
              </div>
              <button className="rounded-[10px] border border-[#dfe6ef] px-3 py-2 text-xs font-semibold" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#64748b]">Banner Image</label>
                <input className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" type="file" accept="image/*" onChange={(e) => handleImage(e.target.files?.[0])} />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 h-36 w-full rounded-[14px] object-cover" />}
              </div>
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Field label="Subtitle" value={form.subtitle} onChange={(value) => setForm({ ...form, subtitle: value })} />
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#64748b]">Details</label>
                <textarea className="mt-1 min-h-[90px] w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
              </div>
              <Field label="External Link URL" value={form.link_url} onChange={(value) => setForm({ ...form, link_url: value })} />
              <Field label="Button Text" value={form.button_text} onChange={(value) => setForm({ ...form, button_text: value })} />
              <Field label="Sort Order" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: value })} />
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm font-semibold text-[#263751]">Show in app</span>
              </div>
              <Field label="Starts At" type="datetime-local" value={form.starts_at} onChange={(value) => setForm({ ...form, starts_at: value })} />
              <Field label="Ends At" type="datetime-local" value={form.ends_at} onChange={(value) => setForm({ ...form, ends_at: value })} />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.title.trim()}>{saving ? "Saving..." : "Save Banner"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#64748b]">{label}</label>
      <input className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
