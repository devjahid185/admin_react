import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  is_enabled: false,
  mailer: "smtp",
  host: "",
  port: 587,
  username: "",
  password: "",
  encryption: "tls",
  from_address: "",
  from_name: "Bholabashi",
  timeout: "",
};

export default function EmailSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [testSubject, setTestSubject] = useState("Bholabashi email settings test");
  const [testMessage, setTestMessage] = useState("This is a test email from the Bholabashi admin panel.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/email-settings", { token });
      const settings = data.settings || {};
      setMeta(settings);
      setForm({
        ...defaultForm,
        is_enabled: Boolean(settings.is_enabled),
        mailer: settings.mailer || "smtp",
        host: settings.host || "",
        port: settings.port || 587,
        username: settings.username || "",
        password: "",
        encryption: settings.encryption || "tls",
        from_address: settings.from_address || "",
        from_name: settings.from_name || "Bholabashi",
        timeout: settings.timeout || "",
      });
    } catch (err) {
      const msg = err.message || "Unable to load email settings.";
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
      const payload = {
        ...form,
        port: Number(form.port || 587),
        timeout: form.timeout ? Number(form.timeout) : null,
      };
      if (!payload.password.trim()) delete payload.password;
      const data = await apiRequest("/admin/email-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setMeta(data.settings || null);
      setForm((prev) => ({ ...prev, password: "" }));
      setSuccess(data.message || "Email settings updated.");
    } catch (err) {
      setError(err.message || "Unable to save email settings.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiRequest("/admin/email-settings/test", {
        method: "POST",
        token,
        body: { to: testTo, subject: testSubject, message: testMessage },
      });
      setMeta(data.settings || meta);
      setSuccess(data.message || "Test email sent.");
    } catch (err) {
      setError(err.message || "Test email failed.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading email settings...</div>;
  }

  const isSmtp = form.mailer === "smtp";

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
        <form onSubmit={save} className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Email Gateway</h2>
              <p className="text-sm text-slate-500">Manage SMTP delivery, sender identity, and test emails.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">{form.is_enabled ? "Enabled" : "Disabled"}</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-red-700"
                checked={form.is_enabled}
                onChange={(e) => updateField("is_enabled", e.target.checked)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Mailer
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.mailer}
                onChange={(e) => updateField("mailer", e.target.value)}
              >
                <option value="smtp">SMTP</option>
                <option value="log">Log only</option>
                <option value="array">Array testing</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Encryption
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.encryption}
                onChange={(e) => updateField("encryption", e.target.value)}
                disabled={!isSmtp}
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="starttls">STARTTLS</option>
                <option value="none">None</option>
              </select>
            </label>
            <Input
              label="SMTP Host"
              value={form.host}
              onChange={(e) => updateField("host", e.target.value)}
              placeholder="smtp.gmail.com"
              disabled={!isSmtp}
            />
            <Input
              label="SMTP Port"
              type="number"
              min="1"
              max="65535"
              value={form.port}
              onChange={(e) => updateField("port", e.target.value)}
              disabled={!isSmtp}
            />
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              placeholder="name@example.com"
              disabled={!isSmtp}
            />
            <Input
              label={`Password ${meta?.password_masked ? `(${meta.password_masked})` : ""}`}
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder={meta?.has_password ? "Leave blank to keep current password" : "SMTP password"}
              disabled={!isSmtp}
            />
            <Input
              label="From Email"
              type="email"
              value={form.from_address}
              onChange={(e) => updateField("from_address", e.target.value)}
              placeholder="no-reply@yourdomain.com"
            />
            <Input
              label="From Name"
              value={form.from_name}
              onChange={(e) => updateField("from_name", e.target.value)}
            />
            <Input
              label="Timeout seconds"
              type="number"
              min="1"
              max="120"
              value={form.timeout}
              onChange={(e) => updateField("timeout", e.target.value)}
              placeholder="Optional"
              disabled={!isSmtp}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Gateway Status</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <span className={form.is_enabled ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>
                  {form.is_enabled ? "Active" : "Off"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Mailer</span>
                <span className="font-semibold text-slate-800">{form.mailer.toUpperCase()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Credential</span>
                <span className="font-semibold text-slate-800">{meta?.has_password ? "Saved" : "Missing"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Last test</span>
                <span className="text-right text-slate-700">{meta?.last_tested_at || "Not tested"}</span>
              </div>
              {meta?.last_test_result && (
                <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">{meta.last_test_result}</div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Send Test Email</h3>
            <div className="mt-4 space-y-3">
              <Input
                label="Recipient email"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="admin@example.com"
              />
              <Input
                label="Subject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
              />
              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </label>
              <Button className="w-full" type="button" onClick={sendTest} disabled={testing || !testTo.trim()}>
                {testing ? "Sending..." : "Send test"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
