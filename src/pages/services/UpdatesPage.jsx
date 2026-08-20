import { useEffect, useMemo, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import QuillEditor from "../../components/QuillEditor.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  cover_url: "",
  body: "",
  tags: "",
  published_at: "",
  is_published: true,
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const parseTags = (value) =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export default function UpdatesPage({ token }) {
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
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editorHint, setEditorHint] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/updates?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load updates.");
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
    setSlugTouched(false);
    setCoverFile(null);
    setCoverPreview("");
    setUploadError("");
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setMode("edit");
    setEditingId(post.id);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      cover_url: post.cover_url || "",
      body: post.body || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      published_at: post.published_at || "",
      is_published: post.is_published !== false,
    });
    setFieldErrors({});
    setSlugTouched(true);
    setCoverFile(null);
    setCoverPreview("");
    setUploadError("");
    setModalOpen(true);
  };

  useEffect(() => {
    if (!slugTouched) {
      setForm((prev) => ({
        ...prev,
        slug: prev.title ? slugify(prev.title) : "",
      }));
    }
  }, [form.title, slugTouched]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const coverImage = useMemo(() => {
    if (coverPreview) return coverPreview;
    if (!form.cover_url) return null;
    if (form.cover_url.startsWith("http")) return form.cover_url;
    return form.cover_url;
  }, [form.cover_url, coverPreview]);

  const uploadCover = async (postId) => {
    if (!coverFile) return null;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("section", "update_post");
      formData.append("target_type", "update_post");
      formData.append("target_id", String(postId));
      formData.append("images[]", coverFile);
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

  const ensureDraft = async () => {
    if (editingId) return editingId;
    if (mode !== "create") return editingId;
    setEditorHint("");

    const draftTitle = form.title.trim() || `Draft ${new Date().toISOString()}`;
    const draftSlug = form.slug.trim() || slugify(draftTitle);
    const draftExcerpt = form.excerpt.trim() || "Draft excerpt";
    const draftBody = form.body?.trim() || "<p>Draft body</p>";

    const payload = {
      title: draftTitle,
      slug: draftSlug,
      excerpt: draftExcerpt,
      body: draftBody,
      tags: form.tags ? parseTags(form.tags) : [],
      published_at: null,
      is_published: false,
    };

    try {
      const data = await apiRequest("/admin/resources/updates", {
        method: "POST",
        token,
        body: payload,
      });
      const record = data.record;
      setMode("edit");
      setEditingId(record.id);
      setForm((prev) => ({
        ...prev,
        title: record.title,
        slug: record.slug,
        excerpt: record.excerpt,
        body: record.body,
        is_published: false,
      }));
      setEditorHint("ÃƒÂ Ã‚Â¦Ã‚Â¡ÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¾ÃƒÂ Ã‚Â¦Ã‚Â«ÃƒÂ Ã‚Â¦Ã…Â¸ ÃƒÂ Ã‚Â¦Ã‚Â¤ÃƒÂ Ã‚Â§Ã‹â€ ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¿ ÃƒÂ Ã‚Â¦Ã‚Â¹ÃƒÂ Ã‚Â§Ã…Â¸ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ÃƒÂ Ã‚Â¦Ã¢â‚¬ÂºÃƒÂ Ã‚Â§Ã¢â‚¬Â¡, ÃƒÂ Ã‚Â¦Ã‚ÂÃƒÂ Ã‚Â¦Ã¢â‚¬â€œÃƒÂ Ã‚Â¦Ã‚Â¨ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â¡ÃƒÂ Ã‚Â¦Ã‚Â®ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ÃƒÂ Ã‚Â¦Ã…â€œ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â¦Ã‚Â²ÃƒÂ Ã‚Â§Ã¢â‚¬Â¹ÃƒÂ Ã‚Â¦Ã‚Â¡ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â¢ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¤ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â¦Ã‚Â¾ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¬ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ÃƒÂ Ã‚Â¦Ã‚Â¨ÃƒÂ Ã‚Â¥Ã‚Â¤");
      return record.id;
    } catch (err) {
      setEditorHint("ÃƒÂ Ã‚Â¦Ã‚Â¡ÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¾ÃƒÂ Ã‚Â¦Ã‚Â«ÃƒÂ Ã‚Â¦Ã…Â¸ ÃƒÂ Ã‚Â¦Ã‚Â¤ÃƒÂ Ã‚Â§Ã‹â€ ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¿ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â¢ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â¾ ÃƒÂ Ã‚Â¦Ã‚Â¯ÃƒÂ Ã‚Â¦Ã‚Â¾ÃƒÂ Ã‚Â§Ã…Â¸ÃƒÂ Ã‚Â¦Ã‚Â¨ÃƒÂ Ã‚Â¦Ã‚Â¿ÃƒÂ Ã‚Â¥Ã‚Â¤ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â ÃƒÂ Ã‚Â¦Ã¢â‚¬â€ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â§Ã…Â¸ÃƒÂ Ã‚Â§Ã¢â‚¬Â¹ÃƒÂ Ã‚Â¦Ã…â€œÃƒÂ Ã‚Â¦Ã‚Â¨ÃƒÂ Ã‚Â§Ã¢â€šÂ¬ÃƒÂ Ã‚Â§Ã…Â¸ ÃƒÂ Ã‚Â¦Ã‚Â«ÃƒÂ Ã‚Â¦Ã‚Â¿ÃƒÂ Ã‚Â¦Ã‚Â²ÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â¡ ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â§Ã¢â‚¬Å¡ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â¦Ã‚Â£ ÃƒÂ Ã‚Â¦Ã¢â‚¬Â¢ÃƒÂ Ã‚Â¦Ã‚Â°ÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â¨ÃƒÂ Ã‚Â¥Ã‚Â¤");
      return null;
    }
  };

  const saveUpdate = async () => {
    setError("");
    setUploadError("");
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!form.slug.trim()) errors.slug = "Slug is required.";
    if (!form.excerpt.trim()) errors.excerpt = "Excerpt is required.";
    if (!form.body.trim()) errors.body = "Body is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      cover_url: form.cover_url || null,
      body: form.body,
      tags: form.tags ? parseTags(form.tags) : [],
      published_at: form.published_at || null,
      is_published: !!form.is_published,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/updates", {
          method: "POST",
          token,
          body: payload,
        });
        let record = data.record;
        if (coverFile) {
          const mediaUrl = await uploadCover(record.id);
          if (mediaUrl) {
            const update = await apiRequest(`/admin/resources/updates/${record.id}`, {
              method: "PUT",
              token,
              body: { cover_url: mediaUrl },
            });
            record = update.record;
            setForm((prev) => ({ ...prev, cover_url: mediaUrl }));
          }
        }
        setRecords((prev) => [record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/updates/${editingId}`, {
          method: "PUT",
          token,
          body: payload,
        });
        let record = data.record;
        if (coverFile) {
          const mediaUrl = await uploadCover(editingId);
          if (mediaUrl) {
            const update = await apiRequest(`/admin/resources/updates/${editingId}`, {
              method: "PUT",
              token,
              body: { cover_url: mediaUrl },
            });
            record = update.record;
            setForm((prev) => ({ ...prev, cover_url: mediaUrl }));
          }
        }
        setRecords((prev) => prev.map((r) => (r.id === editingId ? record : r)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteUpdate = async (id) => {
    await apiRequest(`/admin/resources/updates/${id}`, { method: "DELETE", token });
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
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/updates/${id}`, { method: "DELETE", token })));
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
          <Button onClick={openCreate}>Add Update</Button>
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
              <th className="text-left px-3 py-2 md:px-4">Published</th>
              <th className="text-left px-3 py-2 md:px-4">Date</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((post) => (
              <tr key={post.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(post.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, post.id, e.target.checked))}
                    aria-label={`Select record ${post.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{post.id}</td>
                <td className="px-3 py-2 md:px-4">{post.title}</td>
                <td className="px-3 py-2 md:px-4">{post.slug}</td>
                <td className="px-3 py-2 md:px-4">{post.is_published ? "Yes" : "No"}</td>
                <td className="px-3 py-2 md:px-4">{post.published_at || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(post)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmDeleteId(post.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={7}>
                  {loading ? "Loading..." : "No updates found."}
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
          <div className="w-full max-w-4xl rounded-[18px] border border-[#dfe6ef] bg-white shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#dfe6ef]">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Update" : "Edit Update"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid gap-3 md:grid-cols-2">
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
              <div>
                <label className="text-xs text-[#64748b]">Slug</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value });
                    setSlugTouched(true);
                  }}
                />
                {fieldErrors.slug && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Published at</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Excerpt</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
                {fieldErrors.excerpt && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.excerpt}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Upload Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCoverFile(file);
                  }}
                />
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                {uploading && <p className="text-xs text-[#64748b]">Uploading image...</p>}
                {coverImage && (
                  <div className="mt-2 overflow-hidden rounded-[14px] border border-[#dfe6ef]">
                    <img src={coverImage} alt="Preview" className="h-40 w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Body</label>
                <div className="mt-2 rounded-[14px] border border-[#dfe6ef] overflow-hidden">
                  <QuillEditor
                    value={form.body}
                    onChange={(value) => setForm({ ...form, body: value })}
                    placeholder="ÃƒÂ Ã‚Â¦Ã¢â‚¬Â ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â¦Ã‚Â¨ÃƒÂ Ã‚Â¦Ã‚Â¾ÃƒÂ Ã‚Â¦Ã‚Â° ÃƒÂ Ã‚Â¦Ã¢â‚¬Â ÃƒÂ Ã‚Â¦Ã‚ÂªÃƒÂ Ã‚Â¦Ã‚Â¡ÃƒÂ Ã‚Â§Ã¢â‚¬Â¡ÃƒÂ Ã‚Â¦Ã…Â¸ ÃƒÂ Ã‚Â¦Ã‚Â²ÃƒÂ Ã‚Â¦Ã‚Â¿ÃƒÂ Ã‚Â¦Ã¢â‚¬â€œÃƒÂ Ã‚Â§Ã‚ÂÃƒÂ Ã‚Â¦Ã‚Â¨..."
                    token={token}
                    targetType="update_post"
                    targetId={mode === "edit" ? editingId : null}
                    onRequireSave={ensureDraft}
                  />
                </div>
                {editorHint && <p className="mt-2 text-xs text-amber-600">{editorHint}</p>}
                {fieldErrors.body && <p className="mt-1 text-xs text-red-600">{fieldErrors.body}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Tags (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="update-published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                <label htmlFor="update-published" className="text-sm text-[#53637a]">
                  Published
                </label>
              </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={saveUpdate}
                  disabled={
                    !form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.body.trim()
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[#101827]">Delete update?</h3>
            <p className="mt-2 text-sm text-[#64748b]">
              This update will be permanently removed. You canÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢t undo this action.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await deleteUpdate(id);
                }}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



