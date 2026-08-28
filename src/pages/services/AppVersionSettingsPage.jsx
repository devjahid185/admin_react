import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  platform: "android",
  is_enabled: true,
  latest_version: "1.0.0",
  latest_build: 1,
  minimum_supported_version: "1.0.0",
  minimum_supported_build: 1,
  update_type: "none",
  update_title: "নতুন আপডেট এসেছে",
  update_message: "আরও ভালো অভিজ্ঞতার জন্য অ্যাপ আপডেট করুন।",
  store_url: "https://play.google.com/store/apps/details?id=com.sohojit.frontend_flutter",
  direct_apk_url: "",
  maintenance_mode: false,
  maintenance_title: "সার্ভিস আপডেট চলছে",
  maintenance_message: "আমরা সিস্টেম উন্নত করছি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  maintenance_until: "",
  blocked_versions_text: "",
  changelog: "",
};

export default function AppVersionSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const status = useMemo(() => {
    if (form.maintenance_mode) return { label: "Maintenance active", tone: "red" };
    if (form.update_type === "force") return { label: "Force update", tone: "amber" };
    if (form.update_type === "recommended") return { label: "Recommended update", tone: "emerald" };
    return { label: "Monitoring only", tone: "slate" };
  }, [form.maintenance_mode, form.update_type]);

  const load = async (platform = form.platform) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/app-version-settings?platform=${platform}`, { token });
      setForm({ ...defaultForm, ...(data.settings || {}), platform });
    } catch (err) {
      const msg = err.message || "Unable to load app version settings.";
      setError(msg);
      if (/unauthorized|forbidden/i.test(msg)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("android");
  }, [token]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...form,
        latest_build: Number(form.latest_build || 1),
        minimum_supported_build: Number(form.minimum_supported_build || 1),
        direct_apk_url: form.direct_apk_url || null,
        store_url: form.store_url || null,
        maintenance_until: form.maintenance_until || null,
      };
      const data = await apiRequest("/admin/app-version-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setForm({ ...defaultForm, ...(data.settings || {}), platform: form.platform });
      setSuccess(data.message || "App version settings updated.");
    } catch (err) {
      setError(err.message || "Unable to save app version settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading app version settings...</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#101827]">App Version Control</h2>
              <p className="text-sm text-[#64748b]">Control updates, old app blocking, changelog and maintenance mode.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-medium text-[#24324a]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
              <input type="checkbox" className="h-5 w-5 accent-red-700" checked={Boolean(form.is_enabled)} onChange={(e) => updateField("is_enabled", e.target.checked)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-[#24324a]">
              Platform
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.platform}
                onChange={(e) => {
                  updateField("platform", e.target.value);
                  load(e.target.value);
                }}
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[#24324a]">
              Update behavior
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.update_type}
                onChange={(e) => updateField("update_type", e.target.value)}
              >
                <option value="none">No update prompt</option>
                <option value="recommended">Recommended update</option>
                <option value="force">Force update</option>
              </select>
            </label>
            <Input label="Latest version" value={form.latest_version} onChange={(e) => updateField("latest_version", e.target.value)} />
            <Input label="Latest build number" type="number" value={form.latest_build} onChange={(e) => updateField("latest_build", e.target.value)} />
            <Input label="Minimum supported version" value={form.minimum_supported_version} onChange={(e) => updateField("minimum_supported_version", e.target.value)} />
            <Input label="Minimum supported build" type="number" value={form.minimum_supported_build} onChange={(e) => updateField("minimum_supported_build", e.target.value)} />
            <Input label="Play Store / App Store URL" value={form.store_url || ""} onChange={(e) => updateField("store_url", e.target.value)} />
            <Input label="Direct APK URL" value={form.direct_apk_url || ""} onChange={(e) => updateField("direct_apk_url", e.target.value)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Update dialog title" value={form.update_title} onChange={(e) => updateField("update_title", e.target.value)} />
            <label className="block text-sm font-medium text-[#24324a]">
              Block specific versions
              <input
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.blocked_versions_text || ""}
                onChange={(e) => updateField("blocked_versions_text", e.target.value)}
                placeholder="1.0.1, 1.0.2"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-[#24324a]">
            Update message
            <textarea className="mt-1 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15" value={form.update_message || ""} onChange={(e) => updateField("update_message", e.target.value)} />
          </label>

          <div className="mt-5 rounded-[16px] border border-red-100 bg-red-50/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-[#101827]">Maintenance Mode</h3>
                <p className="text-sm text-[#64748b]">Turn this on only when users must temporarily stop using the app.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-[14px] bg-white px-3 py-2">
                <span className="text-sm font-medium text-[#24324a]">{form.maintenance_mode ? "On" : "Off"}</span>
                <input type="checkbox" className="h-5 w-5 accent-red-700" checked={Boolean(form.maintenance_mode)} onChange={(e) => updateField("maintenance_mode", e.target.checked)} />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="Maintenance title" value={form.maintenance_title} onChange={(e) => updateField("maintenance_title", e.target.value)} />
              <Input label="Maintenance until" type="datetime-local" value={form.maintenance_until || ""} onChange={(e) => updateField("maintenance_until", e.target.value)} />
            </div>
            <label className="mt-4 block text-sm font-medium text-[#24324a]">
              Maintenance message
              <textarea className="mt-1 min-h-20 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15" value={form.maintenance_message || ""} onChange={(e) => updateField("maintenance_message", e.target.value)} />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-[#24324a]">
            Changelog
            <textarea className="mt-1 min-h-28 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15" value={form.changelog || ""} onChange={(e) => updateField("changelog", e.target.value)} placeholder="New features, fixes, security notes..." />
          </label>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save version settings"}</Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">Current Policy</p>
            <div className={`mt-3 rounded-[14px] px-4 py-3 text-sm font-semibold ${status.tone === "red" ? "bg-red-50 text-red-700" : status.tone === "amber" ? "bg-amber-50 text-amber-700" : status.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"}`}>
              {status.label}
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-[#64748b]">Latest</dt><dd className="font-semibold text-[#101827]">{form.latest_version}+{form.latest_build}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#64748b]">Minimum</dt><dd className="font-semibold text-[#101827]">{form.minimum_supported_version}+{form.minimum_supported_build}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#64748b]">Blocked</dt><dd className="font-semibold text-[#101827]">{form.blocked_versions_text || "None"}</dd></div>
            </dl>
          </div>
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 text-sm text-[#53637a] shadow-sm">
            <h3 className="font-semibold text-[#101827]">Recommended rollout</h3>
            <p className="mt-3">Upload new APK/AAB first, keep minimum version old, use recommended update, then switch to force only after the new build is stable.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
