import { useEffect, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../components/BulkDeleteBar.jsx";
import Button from "../components/Button.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import { apiRequest } from "../lib/api.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "user",
  password: "",
  verified: false,
  is_blocked: false,
};

export default function UsersPage({ token, onUnauthorized }) {
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/users?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data);
      setSelectedIds([]);
    } catch (err) {
      const msg = err.message || "Unable to load users.";
      setError(msg);
      if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
        onUnauthorized?.();
      }
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

  const openEdit = (user) => {
    setMode("edit");
    setEditingId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      password: "",
      verified: Boolean(user.verified),
      is_blocked: Boolean(user.is_blocked),
    });
    setModalOpen(true);
  };

  const saveUser = async () => {
    setError("");
    try {
      if (mode === "create") {
        const payload = {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          role: form.role,
          password: form.password,
          verified: form.verified,
          is_blocked: form.is_blocked,
        };
        const data = await apiRequest("/admin/users", { method: "POST", token, body: payload });
        setRecords((prev) => [data.user, ...prev]);
      } else if (editingId) {
        const payload = {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          role: form.role,
          verified: form.verified,
          is_blocked: form.is_blocked,
        };
        const data = await apiRequest(`/admin/users/${editingId}`, { method: "PUT", token, body: payload });
        setRecords((prev) => prev.map((u) => (u.id === editingId ? data.user : u)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const toggleBlock = async (user) => {
    await apiRequest(`/admin/users/${user.id}`, {
      method: "PUT",
      token,
      body: { is_blocked: !user.is_blocked },
    });
    setRecords((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !user.is_blocked } : u))
    );
  };

  const deleteUser = async (id) => {
    await apiRequest(`/admin/users/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => toggleSelectedId(prev, id, false));
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected users? This action cannot be undone.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`/admin/users/${id}`, { method: "DELETE", token })));
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
          placeholder="Search by name, email, phone"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add User</Button>
        </div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.size}
        deleting={bulkDeleting}
        itemLabel="users"
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />

      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-xs md:text-sm">
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
                  aria-label="Select all visible users"
                />
              </th>
              <th className="text-left px-3 py-2 md:px-4">Name</th>
              <th className="text-left px-3 py-2 md:px-4">Email</th>
              <th className="text-left px-3 py-2 md:px-4">Phone</th>
              <th className="text-left px-3 py-2 md:px-4">Role</th>
              <th className="text-left px-3 py-2 md:px-4">Verified</th>
              <th className="text-left px-3 py-2 md:px-4">Status</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((u) => (
              <tr key={u.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, u.id, e.target.checked))}
                    aria-label={`Select user ${u.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{u.name}</td>
                <td className="px-3 py-2 md:px-4">{u.email || "-"}</td>
                <td className="px-3 py-2 md:px-4">{u.phone || "-"}</td>
                <td className="px-3 py-2 md:px-4">{u.role}</td>
                <td className="px-3 py-2 md:px-4">
                  <StatusBadge value={u.verified ? "active" : "pending"} />
                </td>
                <td className="px-3 py-2 md:px-4">
                  <StatusBadge value={u.is_blocked ? "blocked" : "active"} />
                </td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => toggleBlock(u)}>
                      {u.is_blocked ? "Unblock" : "Block"}
                    </Button>
                    <Button variant="ghost" onClick={() => deleteUser(u.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={8}>
                  {loading ? "Loading..." : "No users found."}
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
          <div className="w-full max-w-xl rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add User" : "Edit User"}</h3>
              <button className="text-sm text-[#64748b]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Name</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Email</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Phone</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Role</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="worker">Worker</option>
                  <option value="business">Business</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {mode === "create" && (
                <div>
                  <label className="text-xs text-[#64748b]">Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                />
                <span className="text-sm">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_blocked}
                  onChange={(e) => setForm({ ...form, is_blocked: e.target.checked })}
                />
                <span className="text-sm">Blocked</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveUser}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


