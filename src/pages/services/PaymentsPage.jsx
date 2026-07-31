import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const emptyForm = {
  user_id: "",
  amount: "",
  method: "bkash",
  transaction_id: "",
  status: "pending",
};

const methodOptions = ["bkash", "nagad", "rocket", "card", "cash"];
const statusOptions = ["pending", "success", "failed"];

export default function PaymentsPage({ token }) {
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
      const data = await apiRequest(`/admin/resources/payments?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load payments.");
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

  const openEdit = (pay) => {
    setMode("edit");
    setEditingId(pay.id);
    setForm({
      user_id: pay.user_id ?? "",
      amount: pay.amount ?? "",
      method: pay.method || "bkash",
      transaction_id: pay.transaction_id || "",
      status: pay.status || "pending",
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const savePayment = async () => {
    setError("");
    const errors = {};
    if (!String(form.user_id).trim()) errors.user_id = "User ID is required.";
    if (!String(form.amount).trim() || Number(form.amount) <= 0) errors.amount = "Amount must be greater than 0.";
    if (!form.transaction_id.trim()) errors.transaction_id = "Transaction ID is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      user_id: Number(form.user_id),
      amount: Number(form.amount) || 0,
      method: form.method,
      transaction_id: form.transaction_id,
      status: form.status,
    };
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/payments", {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/payments/${editingId}`, {
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

  const deletePayment = async (id) => {
    await apiRequest(`/admin/resources/payments/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by transaction ID"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Payment</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[960px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]">
            <tr>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">User</th>
              <th className="text-left px-3 py-2 md:px-4">Amount</th>
              <th className="text-left px-3 py-2 md:px-4">Method</th>
              <th className="text-left px-3 py-2 md:px-4">Status</th>
              <th className="text-left px-3 py-2 md:px-4">Created</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((pay) => (
              <tr key={pay.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">{pay.id}</td>
                <td className="px-3 py-2 md:px-4">{pay.user_id}</td>
                <td className="px-3 py-2 md:px-4">{pay.amount}</td>
                <td className="px-3 py-2 md:px-4">{pay.method}</td>
                <td className="px-3 py-2 md:px-4">{pay.status}</td>
                <td className="px-3 py-2 md:px-4">{pay.created_at || "-"}</td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(pay)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deletePayment(pay.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={7}>
                  {loading ? "Loading..." : "No payments found."}
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
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Payment" : "Edit Payment"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-[#64748b]">User ID</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
                {fieldErrors.user_id && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.user_id}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Amount</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                {fieldErrors.amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.amount}</p>}
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Method</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  {methodOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Status</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Transaction ID</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                />
                {fieldErrors.transaction_id && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.transaction_id}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={savePayment}
                disabled={!String(form.user_id).trim() || !String(form.amount).trim() || !form.transaction_id.trim()}
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



