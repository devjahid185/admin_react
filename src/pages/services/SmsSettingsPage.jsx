import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  is_enabled: false,
  provider: "mram",
  api_key: "",
  sender_id: "",
  label: "transactional",
  message_type: "unicode",
  api_url: "https://sms.mram.com.bd/smsapi",
};

export default function SmsSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Bholabashi SMS test.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/sms-settings", { token });
      const settings = data.settings || {};
      setMeta(settings);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setForm({
        ...defaultForm,
        is_enabled: Boolean(settings.is_enabled),
        provider: settings.provider || "mram",
        sender_id: settings.sender_id || "",
        label: settings.label || "transactional",
        message_type: settings.message_type || "unicode",
        api_url: settings.api_url || defaultForm.api_url,
        api_key: "",
      });
    } catch (err) {
      const msg = err.message || "Unable to load SMS settings.";
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
    try {
      const payload = { ...form };
      if (!payload.api_key.trim()) delete payload.api_key;
      const data = await apiRequest("/admin/sms-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setMeta(data.settings || null);
      setLogs(Array.isArray(data.logs) ? data.logs : logs);
      setForm((prev) => ({ ...prev, api_key: "" }));
    } catch (err) {
      setError(err.message || "Unable to save SMS settings.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError("");
    try {
      const data = await apiRequest("/admin/sms-settings/test", {
        method: "POST",
        token,
        body: { phone: testPhone, message: testMessage },
      });
      setMeta(data.settings || meta);
      setLogs(Array.isArray(data.logs) ? data.logs : logs);
    } catch (err) {
      setError(err.message || "Test SMS failed.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6 text-sm text-[#64748b]">Loading SMS settings...</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#101827]">SMS Gateway</h2>
              <p className="text-sm text-[#64748b]">Control OTP delivery and MRAM SMS credentials.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-medium text-[#24324a]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-red-700"
                checked={form.is_enabled}
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
                <option value="mram">MRAM</option>
              </select>
            </label>
            <Input
              label="Sender ID"
              value={form.sender_id}
              onChange={(e) => updateField("sender_id", e.target.value)}
              placeholder="Approved sender ID"
            />
            <Input
              label={`API Key ${meta?.api_key_masked ? `(${meta.api_key_masked})` : ""}`}
              value={form.api_key}
              onChange={(e) => updateField("api_key", e.target.value)}
              placeholder={meta?.has_api_key ? "Leave blank to keep current key" : "Enter API key"}
              type="password"
            />
            <label className="block text-sm font-medium text-[#24324a]">
              SMS Label
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.label}
                onChange={(e) => updateField("label", e.target.value)}
              >
                <option value="transactional">Transactional</option>
                <option value="promotional">Promotional</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[#24324a]">
              Message Type
              <select
                className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.message_type}
                onChange={(e) => updateField("message_type", e.target.value)}
              >
                <option value="unicode">Unicode</option>
                <option value="text">Text</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Input
                label="API URL"
                value={form.api_url}
                onChange={(e) => updateField("api_url", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-5">
            <h3 className="text-base font-semibold text-[#101827]">Gateway Status</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#64748b]">Status</span>
                <span className={form.is_enabled ? "font-semibold text-emerald-700" : "font-semibold text-[#64748b]"}>
                  {form.is_enabled ? "Active" : "Off"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#64748b]">Credential</span>
                <span className="font-semibold text-[#24324a]">{meta?.has_api_key ? "Saved" : "Missing"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#64748b]">Last test</span>
                <span className="text-right text-[#24324a]">{meta?.last_tested_at || "Not tested"}</span>
              </div>
              {meta?.last_test_result && (
                <div className="rounded-[14px] bg-[#f8fafc] p-3 text-xs text-[#53637a]">{meta.last_test_result}</div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-5">
            <h3 className="text-base font-semibold text-[#101827]">Send Test SMS</h3>
            <div className="mt-4 space-y-3">
              <Input
                label="Phone number"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="015XXXXXXXX"
              />
              <label className="block text-sm font-medium text-[#24324a]">
                Message
                <textarea
                  className="mt-1 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </label>
              <Button className="w-full" type="button" onClick={sendTest} disabled={testing || !testPhone.trim()}>
                {testing ? "Sending..." : "Send test"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#edf1f7] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#101827]">Latest SMS logs</h3>
            <p className="text-sm text-[#64748b]">OTP/test SMS success, gateway response and failure reason.</p>
          </div>
          <Button type="button" onClick={load} disabled={loading}>Refresh logs</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">Reason / Gateway response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f7]">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-center text-[#64748b]" colSpan={6}>
                    No SMS logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-[#53637a]">
                      {log.created_at || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#24324a]">
                      {log.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#53637a]">
                      {log.purpose || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }`}>
                        {log.status || "pending"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#53637a]">
                      {log.http_status || "-"}
                    </td>
                    <td className="min-w-[280px] px-4 py-3 text-[#53637a]">
                      <div className="max-w-[520px] break-words">
                        {log.error_message || log.gateway_response || "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

