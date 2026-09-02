import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  is_enabled: true,
  commission_title: "ডেলিভারি কমিশন",
  commission_description: "",
  agreement_title: "রাইডার ডিজিটাল চুক্তি",
  agreement_terms: "",
  cash_policy: "",
  penalty_policy: "",
};

export default function RiderSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/rider-settings", { token });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      const msg = err.message || "Unable to load rider settings.";
      setError(msg);
      if (/unauthorized|forbidden/i.test(msg)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await apiRequest("/admin/rider-settings", {
        method: "PUT",
        token,
        body: form,
      });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      setError(err.message || "Unable to save rider settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading rider settings...</div>;
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Rider System</p>
            <h2 className="mt-1 text-2xl font-black text-[#101827]">Rider Agreement & Commission Text</h2>
            <p className="mt-1 text-sm text-[#64748b]">Rider app-এর commission explanation, legal agreement, cash and penalty rules control করুন।</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-sm font-bold">
            <input type="checkbox" checked={Boolean(form.is_enabled)} onChange={(e) => update("is_enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr,0.7fr]">
        <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Commission Title" value={form.commission_title || ""} onChange={(e) => update("commission_title", e.target.value)} />
            <Input label="Agreement Title" value={form.agreement_title || ""} onChange={(e) => update("agreement_title", e.target.value)} />
            <label className="block text-sm font-semibold text-[#24324a] md:col-span-2">
              Commission Description
              <textarea className="mt-1.5 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" value={form.commission_description || ""} onChange={(e) => update("commission_description", e.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-[#24324a] md:col-span-2">
              Legal Agreement Terms
              <textarea className="mt-1.5 min-h-72 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm leading-6 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" value={form.agreement_terms || ""} onChange={(e) => update("agreement_terms", e.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-[#24324a]">
              Cash Collection Policy
              <textarea className="mt-1.5 min-h-28 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" value={form.cash_policy || ""} onChange={(e) => update("cash_policy", e.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-[#24324a]">
              Penalty & Legal Action Policy
              <textarea className="mt-1.5 min-h-28 w-full rounded-[14px] border border-[#dfe6ef] px-3.5 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" value={form.penalty_policy || ""} onChange={(e) => update("penalty_policy", e.target.value)} />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save rider settings"}</Button>
          </div>
        </div>

        <div className="rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800">App Preview</p>
          <h3 className="mt-2 text-lg font-black text-[#101827]">{form.agreement_title || "Rider Agreement"}</h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#36564f]">{form.commission_description || "Commission explanation will appear here."}</p>
          <div className="mt-4 rounded-[14px] bg-white p-4 text-sm leading-6 text-[#24324a]">
            <p className="whitespace-pre-line">{form.agreement_terms || "Agreement terms will appear here."}</p>
          </div>
        </div>
      </div>
    </form>
  );
}
