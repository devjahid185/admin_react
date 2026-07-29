import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  sender_id: "",
  receiver_id: "",
  message: "",
  image: "",
  seen: false,
};

export default function MessagesPage({ token }) {
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
      const data = await apiRequest(`/admin/resources/messages?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load messages.");
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

  const openEdit = (msg) => {
    setMode("edit");
    setEditingId(msg.id);
    setForm({
      sender_id: msg.sender_id ?? "",
      receiver_id: msg.receiver_id ?? "",
      message: msg.message || "",
      image: msg.image || "",
      seen: !!msg.seen,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const saveMessage = async () => {
    setError("");
    const errors = {};
    if (!String(form.sender_id).trim()) errors.sender_id = "Sender ID is required.";
    if (!String(form.receiver_id).trim()) errors.receiver_id = "Receiver ID is required.";
    if (!form.message.trim()) errors.message = "Message is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      sender_id: Number(form.sender_id),
      receiver_id: Number(form.receiver_id),
      message: form.message,
      image: form.image || null,
      seen: !!form.seen,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/messages", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/messages/${editingId}`, {
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

  const deleteMessage = async (id) => {
    await apiRequest(`/admin/resources/messages/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by text"
          className="w-full md:max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Message</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[920px] w-full text-xs md:text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Sender</th>
              <th className="text-left px-3 py-2 md:px-4">Receiver</th>
              <th className="text-left px-3 py-2 md:px-4">Seen</th>
              <th className="text-left px-3 py-2 md:px-4">Created</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((msg) => (
              <tr key={msg.id} className="border-t border-slate-100">
                <td className="px-3 py-2 md:px-4">{msg.id}</td>
                <td className="px-3 py-2 md:px-4">{msg.sender_id}</td>
                <td className="px-3 py-2 md:px-4">{msg.receiver_id}</td>
                <td className="px-3 py-2 md:px-4">{msg.seen ? "Yes" : "No"}</td>
                <td className="px-3 py-2 md:px-4">{msg.created_at || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(msg)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteMessage(msg.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={6}>
                  {loading ? "Loading..." : "No messages found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Message" : "Edit Message"}</h3>
              <button className="text-sm text-slate-500" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Sender ID</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.sender_id}
                  onChange={(e) => setForm({ ...form, sender_id: e.target.value })}
                />
                {fieldErrors.sender_id && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.sender_id}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500">Receiver ID</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.receiver_id}
                  onChange={(e) => setForm({ ...form, receiver_id: e.target.value })}
                />
                {fieldErrors.receiver_id && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.receiver_id}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Message</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Image URL</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="message-seen"
                  type="checkbox"
                  checked={form.seen}
                  onChange={(e) => setForm({ ...form, seen: e.target.checked })}
                />
                <label htmlFor="message-seen" className="text-sm text-slate-600">
                  Seen
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveMessage}
                disabled={!String(form.sender_id).trim() || !String(form.receiver_id).trim() || !form.message.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


