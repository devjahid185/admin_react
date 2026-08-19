import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  is_enabled: false,
  provider: "google",
  mobile_map_mode: "webview",
  browser_api_key: "",
  maps_javascript_enabled: true,
  embed_enabled: true,
  places_enabled: false,
  directions_enabled: false,
  client_cache_minutes: 1440,
  note: "",
};

export default function MapSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/map-settings", { token });
      const settings = data.settings || {};
      setMeta(settings);
      setForm({
        ...defaultForm,
        ...settings,
        browser_api_key: "",
      });
    } catch (err) {
      const msg = err.message || "Unable to load map settings.";
      setError(msg);
      if (/unauthorized|forbidden/i.test(msg)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { ...form };
      if (!payload.browser_api_key.trim()) delete payload.browser_api_key;
      const data = await apiRequest("/admin/map-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setMeta(data.settings || null);
      setForm((prev) => ({ ...prev, browser_api_key: "" }));
      setSuccess(data.message || "Map settings updated.");
    } catch (err) {
      setError(err.message || "Unable to save map settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading map settings...</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.35fr,0.85fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#101827]">Google Map Settings</h2>
              <p className="text-sm text-[#64748b]">Use one managed key for app and admin map views.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-medium text-[#24324a]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-red-700"
                checked={Boolean(form.is_enabled)}
                onChange={(e) => updateField("is_enabled", e.target.checked)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-[#24324a]">
              Provider
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.provider}
                onChange={(e) => updateField("provider", e.target.value)}
              >
                <option value="google">Google Maps Platform</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[#24324a]">
              App map mode
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.mobile_map_mode || "webview"}
                onChange={(e) => updateField("mobile_map_mode", e.target.value)}
              >
                <option value="webview">WebView Google Map</option>
                <option value="native_android">Native Android Map</option>
              </select>
            </label>
            <Input
              label={`Browser API Key ${meta?.browser_api_key_masked ? `(${meta.browser_api_key_masked})` : ""}`}
              value={form.browser_api_key}
              onChange={(e) => updateField("browser_api_key", e.target.value)}
              placeholder={meta?.has_browser_api_key ? "Leave blank to keep current key" : "Paste Google browser key"}
              type="password"
            />
            <div className="rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] p-3 text-sm text-[#53637a]">
              Key status: <b className="text-[#24324a]">{meta?.has_browser_api_key ? "Saved" : "Missing"}</b>
            </div>
            <Input
              label="Client cache minutes"
              type="number"
              value={form.client_cache_minutes ?? 1440}
              onChange={(e) => updateField("client_cache_minutes", Number(e.target.value || 1440))}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["maps_javascript_enabled", "Maps JavaScript API"],
              ["embed_enabled", "Maps Embed API"],
              ["places_enabled", "Places API"],
              ["directions_enabled", "Directions API"],
            ].map(([field, label]) => (
              <label key={field} className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
                <span className="text-sm font-semibold text-[#24324a]">{label}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-red-700"
                  checked={Boolean(form[field])}
                  onChange={(e) => updateField(field, e.target.checked)}
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-[#24324a]">
            Note
            <textarea
              className="mt-1 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
              value={form.note || ""}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="Restrictions, billing notes, or enabled APIs"
            />
          </label>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save map settings"}</Button>
          </div>
        </form>

        <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#101827]">Cost Control</h3>
          <div className="mt-4 space-y-3 text-sm text-[#53637a]">
            <p>Map settings are cached by clients to avoid repeated settings API calls.</p>
            <p>Directions API is optional and should stay off unless turn-by-turn route distance is required.</p>
            <p>Maps load only inside map/detail screens, not on every list row.</p>
            <p>Native Android mode uses the app's Android Maps SDK key from the APK build, then runtime settings decide when it is active.</p>
            <p>Restrict this key in Google Cloud by domain/package to protect billing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
