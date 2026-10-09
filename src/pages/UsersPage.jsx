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

const pageCss = `
@keyframes upRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes upPop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes upFade{from{opacity:0}to{opacity:1}}
@keyframes upRing{0%{box-shadow:0 0 0 0 rgba(238,0,18,.4)}100%{box-shadow:0 0 0 8px rgba(238,0,18,0)}}
.up-rise{opacity:0;animation:upRise .5s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.up-pop{opacity:0;animation:upPop .35s cubic-bezier(.2,.8,.2,1) both}
.up-fade{animation:upFade .2s ease both}
.up-ring{animation:upRing 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){.up-rise,.up-pop,.up-fade,.up-ring{animation:none!important;opacity:1!important}}
`;

const ROLE_TONE = {
  admin: "bg-[#111] text-white",
  business: "bg-[#fef2f2] text-[#ee0012]",
  worker: "bg-[#f3f4f6] text-[#374151]",
  user: "bg-[#f3f4f6] text-[#374151]",
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
      if (!form.name.trim() || !form.phone.trim()) {
        setError("Name and phone number are required.");
        return;
      }
      if (mode === "create") {
        const payload = {
          name: form.name.trim(),
          email: form.email || null,
          phone: form.phone.trim(),
          role: form.role,
          password: form.password || null,
          verified: form.verified,
          is_blocked: form.is_blocked,
        };
        const data = await apiRequest("/admin/users", { method: "POST", token, body: payload });
        setRecords((prev) => [data.user, ...prev]);
      } else if (editingId) {
        const payload = {
          name: form.name.trim(),
          email: form.email || null,
          phone: form.phone.trim(),
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
      <style>{pageCss}</style>
      {error && (
        <div className="up-rise rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">{error}</div>
      )}

      <div className="up-rise flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search by name, email, phone"
            className="w-full rounded-2xl border border-[#ececec] bg-white py-2.5 pl-10 pr-3 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1.5 text-xs font-bold text-[#6b7280]">
            <span className="h-2 w-2 rounded-full bg-[#ee0012]" />
            Total: {meta?.total || records.length}
          </span>
          <Button onClick={openCreate}>Add User</Button>
        </div>
      </div>

      <div className="up-rise" style={{ "--d": "40ms" }}>
        <BulkDeleteBar
          selectedCount={selectedIds.length}
          deleting={bulkDeleting}
          itemLabel="users"
          onClear={() => setSelectedIds([])}
          onDelete={bulkDelete}
        />
      </div>

      <div className="up-rise overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ "--d": "80ms" }}>
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#6b7280]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ee0012]"
                  checked={selectionState.allVisibleSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = selectionState.someVisibleSelected;
                  }}
                  onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                  aria-label="Select all visible users"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Verified</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((u, i) => (
              <tr key={u.id} className="up-fade border-t border-[#f3f4f6] transition hover:bg-[#fef2f2]/50" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#ee0012]"
                    checked={selectedIds.includes(u.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, u.id, e.target.checked))}
                    aria-label={`Select user ${u.id}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3f4f6] text-xs font-bold text-[#374151]">
                      {(u.name || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold text-[#111]">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#374151]">{u.email || "-"}</td>
                <td className="px-4 py-3 text-[#374151]">{u.phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${ROLE_TONE[u.role] || ROLE_TONE.user}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={u.verified ? "active" : "pending"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={u.is_blocked ? "blocked" : "active"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col justify-end gap-2 md:flex-row">
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
                <td className="px-4 py-10 text-center text-sm text-[#9ca3af]" colSpan={8}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="up-ring h-2 w-2 rounded-full bg-[#ee0012]" />
                      Loading...
                    </span>
                  ) : (
                    "No users found."
                  )}
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
        <div className="up-fade fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="up-pop max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[26px] border border-[#ececec] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ececec] pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ee0012]">{mode === "create" ? "New account" : "Edit account"}</p>
                <h3 className="mt-1 text-lg font-black text-[#111]">{mode === "create" ? "Add User" : "Edit User"}</h3>
              </div>
              <button
                className="grid h-8 w-8 place-items-center rounded-full text-lg font-bold text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#111]"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Name *</label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Email optional</label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Phone *</label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Role</label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-[#ececec] bg-white px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
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
                  <label className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Password optional</label>
                  <input
                    type="password"
                    className="mt-1.5 w-full rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <p className="mt-1 text-xs font-medium text-[#9ca3af]">Blank রাখলে system auto password create করবে। OTP/Google login user-এর জন্য দরকার নেই।</p>
                </div>
              )}
              <label className="flex items-center gap-2.5 rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm font-semibold text-[#111] transition hover:border-[#ee0012]/35">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ee0012]"
                  checked={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                />
                Verified
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-[#ececec] px-3.5 py-2.5 text-sm font-semibold text-[#111] transition hover:border-[#ee0012]/35">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ee0012]"
                  checked={form.is_blocked}
                  onChange={(e) => setForm({ ...form, is_blocked: e.target.checked })}
                />
                Blocked
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-[#ececec] pt-4">
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
