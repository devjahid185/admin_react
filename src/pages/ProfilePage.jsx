import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";
import Button from "../components/Button.jsx";

export default function ProfilePage({ token, onUnauthorized }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/admin/profile", { token });
        setForm((prev) => ({
          ...prev,
          name: data?.name || "",
          email: data?.email || "",
          password: "",
        }));
      } catch (err) {
        setError(err.message || "Unable to load profile.");
        if (err.message?.toLowerCase().includes("forbidden")) {
          onUnauthorized?.();
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, onUnauthorized]);

  const update = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
      };
      if (form.password?.trim()) {
        payload.password = form.password.trim();
      }
      const res = await apiRequest("/admin/profile", { method: "POST", token, body: payload });
      setSuccess(res?.message || "Profile updated.");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#101827]">Admin profile</h2>
            <p className="text-sm text-[#64748b]">Update your account details safely.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-sm text-[#64748b]">Loading profile...</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#64748b]">Full name</label>
              <input
                className="mt-2 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748b]">Email</label>
              <input
                className="mt-2 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748b]">New password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                placeholder="Leave blank to keep unchanged"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={update} disabled={saving || loading}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {success && <span className="text-xs text-emerald-600">{success}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}



