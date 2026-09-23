import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { apiRequest } from "../lib/api.js";

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  is_super: false,
  is_active: true,
  permissions: {},
};

function normalizePermissions(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).map(([slug, actions]) => [slug, Array.isArray(actions) ? actions : []])
  );
}

function hasAction(permissions, slug, action) {
  return (permissions?.[slug] || []).includes(action);
}

function setAction(permissions, slug, action, checked) {
  const current = new Set(permissions?.[slug] || []);
  if (checked) current.add(action);
  else current.delete(action);
  const next = { ...permissions, [slug]: Array.from(current) };
  if (!next[slug].length) delete next[slug];
  return next;
}

export default function StaffManagementPage({ token, onUnauthorized }) {
  const [staff, setStaff] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const groupedCatalog = useMemo(() => {
    const map = new Map();
    catalog.forEach((item) => {
      const group = item.group_name || "General";
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(item);
    });
    return Array.from(map.entries());
  }, [catalog]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/admins", { token });
      setStaff(data.admins || []);
      setCatalog(data.permission_catalog || []);
    } catch (err) {
      const msg = err.message || "Unable to load staff.";
      setError(msg);
      if (/unauthorized|forbidden/i.test(msg)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setMode("edit");
    setEditingId(admin.id);
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
      is_super: Boolean(admin.is_super),
      is_active: admin.is_active !== false,
      permissions: normalizePermissions(admin.permissions),
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        is_super: form.is_super,
        is_active: form.is_active,
        permissions: form.is_super ? {} : normalizePermissions(form.permissions),
      };
      if (form.password.trim()) payload.password = form.password.trim();
      const path = mode === "create" ? "/admin/admins" : `/admin/admins/${editingId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const data = await apiRequest(path, { method, token, body: payload });
      setStaff((prev) => mode === "create"
        ? [data.admin, ...prev]
        : prev.map((item) => (item.id === editingId ? data.admin : item)));
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (admin) => {
    if (!window.confirm(`Delete staff account ${admin.name}?`)) return;
    await apiRequest(`/admin/admins/${admin.id}`, { method: "DELETE", token });
    setStaff((prev) => prev.filter((item) => item.id !== admin.id));
  };

  const selectGroup = (items, checked) => {
    const next = { ...form.permissions };
    items.forEach((item) => {
      next[item.slug] = checked ? item.actions : [];
      if (!next[item.slug].length) delete next[item.slug];
    });
    setForm({ ...form, permissions: next });
  };

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ee0012]">Access control</p>
            <h2 className="mt-1 text-xl font-black text-[#101827]">Staff / User Management</h2>
            <p className="mt-1 text-sm text-[#64748b]">Create staff accounts and decide exactly which admin pages and actions they can use.</p>
          </div>
          <Button onClick={openCreate}>Add Staff</Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-[18px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-[#f8fafc] text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">
            <tr>
              <th className="px-4 py-3 text-left">Staff</th>
              <th className="px-4 py-3 text-left">Access Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((admin) => {
              const permissionCount = Object.values(admin.permissions || {}).reduce((sum, actions) => sum + (actions?.length || 0), 0);
              return (
                <tr key={admin.id} className="border-t border-[#edf1f6]">
                  <td className="px-4 py-4">
                    <p className="font-black text-[#101827]">{admin.name}</p>
                    <p className="text-xs font-semibold text-[#64748b]">{admin.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${admin.is_super ? "bg-red-50 text-[#ee0012]" : "bg-[#f1f5f9] text-[#24324a]"}`}>
                      {admin.is_super ? "Full Admin" : `${permissionCount} permissions`}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${admin.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {admin.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#64748b]">{admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => openEdit(admin)}>Edit</Button>
                      <Button variant="ghost" onClick={() => remove(admin)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!staff.length && (
              <tr>
                <td className="px-4 py-8 text-center text-[#64748b]" colSpan={5}>
                  {loading ? "Loading staff..." : "No staff account found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[22px] border border-[#dfe6ef] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] p-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ee0012]">{mode === "create" ? "New staff" : "Edit staff"}</p>
                <h3 className="mt-1 text-xl font-black text-[#101827]">Staff access setup</h3>
              </div>
              <button className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm font-black" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label={mode === "create" ? "Password" : "New password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between gap-4 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] px-4 py-3">
                  <span>
                    <span className="block text-sm font-black text-[#101827]">Full admin access</span>
                    <span className="text-xs font-semibold text-[#64748b]">Can open and manage every admin page.</span>
                  </span>
                  <input type="checkbox" checked={form.is_super} onChange={(e) => setForm({ ...form, is_super: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] px-4 py-3">
                  <span>
                    <span className="block text-sm font-black text-[#101827]">Active staff account</span>
                    <span className="text-xs font-semibold text-[#64748b]">Inactive staff cannot login.</span>
                  </span>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                </label>
              </div>

              {!form.is_super && (
                <div className="mt-5 space-y-4">
                  {groupedCatalog.map(([group, items]) => (
                    <section key={group} className="rounded-[18px] border border-[#dfe6ef] bg-white p-4">
                      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="font-black text-[#101827]">{group}</h4>
                          <p className="text-xs font-semibold text-[#64748b]">{items.length} admin pages</p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" onClick={() => selectGroup(items, true)}>Allow group</Button>
                          <Button type="button" variant="ghost" onClick={() => selectGroup(items, false)}>Clear group</Button>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {items.map((item) => (
                          <div key={item.slug} className="grid gap-3 rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-3 md:grid-cols-[1fr,auto] md:items-center">
                            <div>
                              <p className="font-black text-[#101827]">{item.name}</p>
                              <p className="text-xs font-semibold text-[#8b98ab]">{item.slug}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(item.actions || []).map((action) => (
                                <label key={`${item.slug}-${action}`} className="flex items-center gap-2 rounded-full border border-[#dfe6ef] bg-white px-3 py-1.5 text-xs font-black text-[#24324a]">
                                  <input
                                    type="checkbox"
                                    checked={hasAction(form.permissions, item.slug, action)}
                                    onChange={(e) => setForm({ ...form, permissions: setAction(form.permissions, item.slug, action, e.target.checked) })}
                                  />
                                  {ACTION_LABELS[action] || action}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#edf1f6] p-5">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Staff"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
