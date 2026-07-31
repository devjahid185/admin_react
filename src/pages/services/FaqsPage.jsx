import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  category: "",
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
};

export default function FaqsPage({ token }) {
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
  const [fieldErrors, setFieldErrors] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/faqs?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load FAQs.");
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
    setModalOpen(true);
  };

  const openEdit = (faq) => {
    setMode("edit");
    setEditingId(faq.id);
    setForm({
      category: faq.category || "",
      question: faq.question || "",
      answer: faq.answer || "",
      sort_order: Number.isFinite(faq.sort_order) ? faq.sort_order : 0,
      is_active: faq.is_active !== false,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const saveFaq = async () => {
    setError("");
    const errors = {};
    if (!form.question.trim()) errors.question = "Question is required.";
    if (!form.answer.trim()) errors.answer = "Answer is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      category: form.category || null,
      question: form.question,
      answer: form.answer,
      sort_order: Number(form.sort_order) || 0,
      is_active: !!form.is_active,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/faqs", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/faqs/${editingId}`, {
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

  const deleteFaq = async (id) => {
    await apiRequest(`/admin/resources/faqs/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by question"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add FAQ</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Question</th>
              <th className="text-left px-3 py-2 md:px-4">Active</th>
              <th className="text-left px-3 py-2 md:px-4">Order</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((faq) => (
              <tr key={faq.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">{faq.id}</td>
                <td className="px-3 py-2 md:px-4">{faq.category || "-"}</td>
                <td className="px-3 py-2 md:px-4">{faq.question}</td>
                <td className="px-3 py-2 md:px-4">{faq.is_active ? "Yes" : "No"}</td>
                <td className="px-3 py-2 md:px-4">{faq.sort_order}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(faq)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteFaq(faq.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={6}>
                  {loading ? "Loading..." : "No FAQs found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add FAQ" : "Edit FAQ"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Category</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Question</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                />
                {fieldErrors.question && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.question}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Answer</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                />
                {fieldErrors.answer && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.answer}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Sort order</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="faq-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="faq-active" className="text-sm text-[#53637a]">
                  Active
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveFaq} disabled={!form.question.trim() || !form.answer.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



