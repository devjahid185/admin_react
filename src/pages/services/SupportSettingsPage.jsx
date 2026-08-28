import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  phone: "",
  email: "",
  whatsapp: "",
  availability: "",
  note: "",
};

export default function SupportSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/support-settings", { token });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      const msg = err.message || "Unable to load support settings.";
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
      const data = await apiRequest("/admin/support-settings", {
        method: "PUT",
        token,
        body: form,
      });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      setError(err.message || "Unable to save support settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">
        Loading support settings...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#101827]">Help & Support Contact</h2>
          <p className="text-sm text-[#64748b]">These details will show inside the app help and support page.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Support phone"
            value={form.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="017XXXXXXXX"
          />
          <Input
            label="Support email"
            type="email"
            value={form.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="support@bholavashi.site"
          />
          <Input
            label="WhatsApp"
            value={form.whatsapp || ""}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            placeholder="017XXXXXXXX"
          />
          <Input
            label="Support time"
            value={form.availability || ""}
            onChange={(e) => updateField("availability", e.target.value)}
            placeholder="প্রতিদিন সকাল ৯টা থেকে রাত ১০টা"
          />
          <label className="block text-sm font-medium text-[#24324a] md:col-span-2">
            Support note
            <textarea
              className="mt-1 min-h-28 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
              value={form.note || ""}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="Short instruction or emergency support note"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <Button disabled={saving}>{saving ? "Saving..." : "Save support settings"}</Button>
        </div>
      </form>
    </div>
  );
}
