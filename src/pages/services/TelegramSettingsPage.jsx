import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const EVENT_OPTIONS = [
  { key: "orders", label: "Orders & payments", hint: "Food/medicine orders, payment proof and customer cancellation." },
  { key: "support", label: "Support tickets", hint: "Customer and rider support requests requiring attention." },
  { key: "registrations", label: "Registrations", hint: "New users, riders, restaurants, workers and service providers." },
  { key: "submissions", label: "Bookings & submissions", hint: "Appointments, marketplace, jobs, blood, education and service requests." },
  { key: "messages_reviews", label: "Messages & reviews", hint: "Customer messages, ratings and review activity." },
];

const defaultForm = {
  is_enabled: false,
  bot_token: "",
  chat_ids_text: "",
  message_thread_id: "",
  event_types: EVENT_OPTIONS.map((item) => item.key),
  include_details: true,
  portal_url: "https://portal.bholavashi.site",
};

export default function TelegramSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/telegram-settings", { token });
      const settings = data.settings || {};
      setMeta(settings);
      setForm({
        ...defaultForm,
        is_enabled: Boolean(settings.is_enabled),
        bot_token: "",
        chat_ids_text: (settings.chat_ids || []).join("\n"),
        message_thread_id: settings.message_thread_id || "",
        event_types: settings.event_types?.length ? settings.event_types : defaultForm.event_types,
        include_details: settings.include_details !== false,
        portal_url: settings.portal_url || defaultForm.portal_url,
      });
    } catch (err) {
      const message = err.message || "Unable to load Telegram settings.";
      setError(message);
      if (/unauthorized|forbidden/i.test(message)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleEvent = (key) => {
    setForm((prev) => ({
      ...prev,
      event_types: prev.event_types.includes(key)
        ? prev.event_types.filter((item) => item !== key)
        : [...prev.event_types, key],
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        is_enabled: form.is_enabled,
        bot_token: form.bot_token.trim(),
        chat_ids: form.chat_ids_text.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean),
        message_thread_id: form.message_thread_id ? Number(form.message_thread_id) : null,
        event_types: form.event_types,
        include_details: form.include_details,
        portal_url: form.portal_url.trim(),
      };
      if (!payload.bot_token) delete payload.bot_token;
      const data = await apiRequest("/admin/telegram-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setMeta(data.settings || null);
      setForm((prev) => ({ ...prev, bot_token: "" }));
      setNotice(data.message || "Telegram settings saved.");
    } catch (err) {
      setError(err.message || "Unable to save Telegram settings.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest("/admin/telegram-settings/test", { method: "POST", token });
      setMeta(data.settings || meta);
      setNotice(data.message || "Test alert delivered.");
    } catch (err) {
      setError(err.message || "Telegram test failed.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading Telegram alerts...</div>;
  }

  const configured = Boolean(meta?.has_bot_token && (meta?.chat_ids || []).length);

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#101827]">Telegram Admin Alerts</h2>
              <p className="text-sm text-[#64748b]">Send real-time operational events to trusted Telegram chats.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-medium text-[#24324a]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
              <input type="checkbox" className="h-5 w-5 accent-red-700" checked={form.is_enabled} onChange={(e) => updateField("is_enabled", e.target.checked)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={`Bot token ${meta?.bot_token_masked ? `(${meta.bot_token_masked})` : ""}`}
              type="password"
              value={form.bot_token}
              onChange={(e) => updateField("bot_token", e.target.value)}
              placeholder={meta?.has_bot_token ? "Leave blank to keep current token" : "Paste the new BotFather token"}
            />
            <Input label="Portal URL" value={form.portal_url} onChange={(e) => updateField("portal_url", e.target.value)} placeholder="https://portal.bholavashi.site" />
            <label className="block text-sm font-medium text-[#24324a] md:col-span-2">
              Telegram chat IDs
              <textarea
                rows="3"
                className="mt-1 w-full resize-y rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.chat_ids_text}
                onChange={(e) => updateField("chat_ids_text", e.target.value)}
                placeholder="One private, group or channel chat ID per line"
                required
              />
              <span className="mt-1 block text-xs font-normal text-[#7b8798]">For a group or channel, add the bot first and use its negative chat ID.</span>
            </label>
            <Input
              label="Topic ID (optional)"
              type="number"
              min="1"
              value={form.message_thread_id}
              onChange={(e) => updateField("message_thread_id", e.target.value)}
              placeholder="Telegram forum topic ID"
            />
          </div>

          <div className="mt-6 border-t border-[#e8edf3] pt-5">
            <h3 className="text-sm font-semibold text-[#101827]">Events to notify</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {EVENT_OPTIONS.map((item) => (
                <label key={item.key} className="flex cursor-pointer gap-3 rounded-[12px] border border-[#e4eaf1] px-3 py-3 hover:border-[#c8d5e2]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-red-700" checked={form.event_types.includes(item.key)} onChange={() => toggleEvent(item.key)} />
                  <span>
                    <span className="block text-sm font-semibold text-[#24324a]">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#718096]">{item.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-[#e8edf3] pt-5">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-red-700" checked={form.include_details} onChange={(e) => updateField("include_details", e.target.checked)} />
            <span>
              <span className="block text-sm font-semibold text-[#24324a]">Include operational details</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#718096]">Includes safe order, customer and request details. Passwords, OTPs and tokens are always excluded.</span>
            </span>
          </label>

          <div className="mt-5 flex justify-end"><Button disabled={saving || !form.event_types.length}>{saving ? "Saving..." : "Save settings"}</Button></div>
        </form>

        <div className="space-y-4">
          <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#101827]">Connection Status</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-[#64748b]">Delivery</span><span className={form.is_enabled ? "font-semibold text-emerald-700" : "font-semibold text-[#64748b]"}>{form.is_enabled ? "Active" : "Off"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#64748b]">Bot token</span><span className="font-semibold text-[#24324a]">{meta?.has_bot_token ? "Encrypted" : "Missing"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#64748b]">Destinations</span><span className="font-semibold text-[#24324a]">{(meta?.chat_ids || []).length}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#64748b]">Last test</span><span className="text-right text-[#24324a]">{meta?.last_tested_at || "Not tested"}</span></div>
              {meta?.last_test_result && <div className="rounded-[12px] bg-[#f8fafc] p-3 text-xs leading-5 text-[#53637a]">{meta.last_test_result}</div>}
            </div>
          </section>

          <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#101827]">Delivery Test</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Save the new BotFather token and destination chat first, then verify end-to-end delivery.</p>
            <div className="mt-4"><Button onClick={sendTest} disabled={testing || !configured}>{testing ? "Sending..." : "Send test alert"}</Button></div>
          </section>
        </div>
      </div>
    </div>
  );
}
