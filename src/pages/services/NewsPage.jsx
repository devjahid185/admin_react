import { useEffect, useMemo, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import ImageUploadPreview from "../../components/ImageUploadPreview.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const emptyForm = {
  title: "",
  image: "",
  content: "",
  author: "",
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function NewsPage({ token }) {
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [formSlug, setFormSlug] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/news?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load news.");
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
    setFieldErrors({});
    setFormSlug("");
    setSlugTouched(false);
    setImageFile(null);
    setUploadError("");
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setMode("edit");
    setEditingId(n.id);
    setForm({
      title: n.title || "",
      image: n.image || "",
      content: n.content || "",
      author: n.author || "",
    });
    setFieldErrors({});
    setFormSlug(n.slug || "");
    setSlugTouched(true);
    setImageFile(null);
    setUploadError("");
    setModalOpen(true);
  };

  useEffect(() => {
    if (!slugTouched) {
      setFormSlug(form.title ? slugify(form.title) : "");
    }
  }, [form.title, slugTouched]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const previewImage = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (!form.image) return null;
    if (form.image.startsWith("http")) return form.image;
    return form.image;
  }, [form.image, imagePreview]);

  const uploadImage = async (newsId) => {
    if (!imageFile) return null;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("section", "news");
      formData.append("target_type", "news");
      formData.append("target_id", String(newsId));
      formData.append("images[]", imageFile);
      formData.append("set_primary", "true");
      const data = await apiUpload("/media/upload", { token, formData });
      const mediaUrl = data?.media?.[0]?.url || null;
      return mediaUrl;
    } catch (err) {
      setUploadError(err.message || "Image upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveNews = async () => {
    setError("");
    setUploadError("");
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!form.content.trim()) errors.content = "Content is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      title: form.title,
      slug: formSlug || null,
      image: form.image || null,
      content: form.content,
      author: form.author || null,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/news", {
          method: "POST",
          token,
          body: payload,
        });
        let record = data.record;
        if (imageFile) {
          const mediaUrl = await uploadImage(record.id);
          if (mediaUrl) {
            const update = await apiRequest(`/admin/resources/news/${record.id}`, {
              method: "PUT",
              token,
              body: { image: mediaUrl, slug: formSlug || null },
            });
            record = update.record;
            setForm((prev) => ({ ...prev, image: mediaUrl }));
          }
        }
        setRecords((prev) => [record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/news/${editingId}`, {
          method: "PUT",
          token,
          body: payload,
        });
        let record = data.record;
        if (imageFile) {
          const mediaUrl = await uploadImage(editingId);
          if (mediaUrl) {
            const update = await apiRequest(`/admin/resources/news/${editingId}`, {
              method: "PUT",
              token,
              body: { image: mediaUrl, slug: formSlug || null },
            });
            record = update.record;
            setForm((prev) => ({ ...prev, image: mediaUrl }));
          }
        }
        setRecords((prev) => prev.map((r) => (r.id === editingId ? record : r)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteNews = async (id) => {
    await apiRequest(`/admin/resources/news/${id}`, { method: "DELETE", token });
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
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/news/${id}`, { method: "DELETE", token })));
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
          placeholder="Search by title"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add News</Button>
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
              <th className="text-left px-3 py-2 md:px-4">Title</th>
              <th className="text-left px-3 py-2 md:px-4">Slug</th>
              <th className="text-left px-3 py-2 md:px-4">Author</th>
              <th className="text-left px-3 py-2 md:px-4">Created</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((n) => (
              <tr key={n.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(n.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, n.id, e.target.checked))}
                    aria-label={`Select record ${n.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{n.id}</td>
                <td className="px-3 py-2 md:px-4">{n.title}</td>
                <td className="px-3 py-2 md:px-4">{n.slug || "-"}</td>
                <td className="px-3 py-2 md:px-4">{n.author || "-"}</td>
                <td className="px-3 py-2 md:px-4">{n.created_at || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(n)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteNews(n.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={7}>
                  {loading ? "Loading..." : "No news found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add News" : "Edit News"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Title</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Slug</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Image URL</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <div className="mt-3 flex flex-col gap-2">
                  <label className="text-xs text-[#64748b]">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                    }}
                  />
                  {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                  {uploading && <p className="text-xs text-[#64748b]">Uploading image...</p>}
                </div>
                <div className="mt-3">
                  <ImageUploadPreview
                    file={imageFile}
                    url={imageFile ? "" : previewImage || ""}
                    label="News image preview"
                    hint="News image preview"
                    onClear={() => {
                      setImageFile(null);
                      setForm({ ...form, image: "" });
                    }}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Content</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                {fieldErrors.content && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.content}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Author</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveNews} disabled={!form.title.trim() || !form.content.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


