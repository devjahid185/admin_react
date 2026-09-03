import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  cod_enabled: true,
  manual_bkash_enabled: false,
  manual_nagad_enabled: false,
  online_enabled: false,
  bkash_tokenized_enabled: false,
  bkash_tokenized_sandbox: true,
  require_manual_payment_proof: false,
  cod_title: "Cash on Delivery",
  manual_bkash_title: "Manual bKash",
  manual_nagad_title: "Manual Nagad",
  online_title: "Online Payment",
  bkash_tokenized_title: "bKash Checkout",
  bkash_number: "",
  nagad_number: "",
  bkash_tokenized_base_url: "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout",
  bkash_tokenized_app_key: "",
  bkash_tokenized_app_secret: "",
  bkash_tokenized_username: "",
  bkash_tokenized_password: "",
  bkash_tokenized_credentials_ready: false,
  cod_instructions: "মেডিসিন হাতে পেয়ে টাকা দিন।",
  manual_bkash_instructions: "Send Money করে transaction ID দিন।",
  manual_nagad_instructions: "Send Money করে transaction ID দিন।",
  online_instructions: "",
  bkash_tokenized_instructions: "bKash checkout পেজে নিরাপদে পেমেন্ট সম্পন্ন করুন।",
  payment_notice: "",
};

const methodConfigs = [
  {
    key: "cod",
    enabled: "cod_enabled",
    title: "cod_title",
    instructions: "cod_instructions",
    heading: "Cash on Delivery",
    tone: "amber",
  },
  {
    key: "bkash",
    enabled: "manual_bkash_enabled",
    title: "manual_bkash_title",
    number: "bkash_number",
    instructions: "manual_bkash_instructions",
    heading: "Manual bKash",
    tone: "pink",
  },
  {
    key: "nagad",
    enabled: "manual_nagad_enabled",
    title: "manual_nagad_title",
    number: "nagad_number",
    instructions: "manual_nagad_instructions",
    heading: "Manual Nagad",
    tone: "orange",
  },
  {
    key: "bkash_tokenized",
    enabled: "bkash_tokenized_enabled",
    title: "bkash_tokenized_title",
    instructions: "bkash_tokenized_instructions",
    heading: "bKash Tokenized Checkout",
    tone: "rose",
  },
  {
    key: "online",
    enabled: "online_enabled",
    title: "online_title",
    instructions: "online_instructions",
    heading: "Online Payment",
    tone: "emerald",
  },
];

const toneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  pink: "border-pink-200 bg-pink-50 text-pink-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default function MedicinePaymentSettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const enabledCount = useMemo(
    () => methodConfigs.filter((method) => Boolean(form[method.enabled])).length,
    [form],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/medicine-payment-settings", { token });
      setForm({ ...defaultForm, ...(data.settings || {}) });
      setPaymentOptions(data.payment_options || []);
    } catch (err) {
      const msg = err.message || "Unable to load medicine payment settings.";
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
      const data = await apiRequest("/admin/medicine-payment-settings", {
        method: "PUT",
        token,
        body: form,
      });
      setForm({ ...defaultForm, ...(data.settings || {}) });
      setPaymentOptions(data.payment_options || []);
    } catch (err) {
      setError(err.message || "Unable to save medicine payment settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading medicine payment settings...</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.75fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Medicine Delivery</p>
              <h2 className="mt-1 text-xl font-semibold text-[#101827]">Payment Controls</h2>
              <p className="mt-1 text-sm text-[#64748b]">Control the payment methods customers can select during medicine checkout.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-semibold text-[#24324a]">Manual proof required</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-red-700"
                checked={Boolean(form.require_manual_payment_proof)}
                onChange={(e) => updateField("require_manual_payment_proof", e.target.checked)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {methodConfigs.map((method) => (
              <section key={method.key} className={`rounded-[14px] border p-4 ${toneClasses[method.tone]}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{method.heading}</h3>
                    <p className="text-xs opacity-80">{form[method.enabled] ? "Available in checkout" : "Hidden from checkout"}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-red-700"
                    checked={Boolean(form[method.enabled])}
                    onChange={(e) => updateField(method.enabled, e.target.checked)}
                  />
                </div>
                <div className="space-y-3">
                  <Input label="Display Title" value={form[method.title] || ""} onChange={(e) => updateField(method.title, e.target.value)} />
                  {method.number && <Input label="Payment Number" value={form[method.number] || ""} onChange={(e) => updateField(method.number, e.target.value)} placeholder="01XXXXXXXXX" />}
                  <label className="block text-sm font-semibold text-[#24324a]">
                    Instructions
                    <textarea
                      className="mt-1.5 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
                      value={form[method.instructions] || ""}
                      onChange={(e) => updateField(method.instructions, e.target.value)}
                    />
                  </label>
                </div>
              </section>
            ))}

            <section className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-semibold text-[#101827]">bKash Tokenized Credentials</h3>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {form.bkash_tokenized_credentials_ready ? "Credentials are saved. Enter a new value only when you want to replace it." : "Add credentials before enabling bKash checkout for users."}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#24324a]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-red-700"
                    checked={Boolean(form.bkash_tokenized_sandbox)}
                    onChange={(e) => {
                      const sandbox = e.target.checked;
                      updateField("bkash_tokenized_sandbox", sandbox);
                      updateField(
                        "bkash_tokenized_base_url",
                        sandbox
                          ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout"
                          : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout",
                      );
                    }}
                  />
                  Sandbox mode
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Base URL" value={form.bkash_tokenized_base_url || ""} onChange={(e) => updateField("bkash_tokenized_base_url", e.target.value)} />
                <label className="block text-sm font-semibold text-[#24324a]">
                  Callback URL
                  <div className="mt-1.5 rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#64748b] shadow-sm">
                    {form.bkash_tokenized_callback_url || "Server will generate automatically"}
                  </div>
                </label>
                <Input label="App Key" value={form.bkash_tokenized_app_key || ""} onChange={(e) => updateField("bkash_tokenized_app_key", e.target.value)} placeholder="bKash app key" />
                <Input label="App Secret" value={form.bkash_tokenized_app_secret || ""} onChange={(e) => updateField("bkash_tokenized_app_secret", e.target.value)} placeholder="bKash app secret" />
                <Input label="Username" value={form.bkash_tokenized_username || ""} onChange={(e) => updateField("bkash_tokenized_username", e.target.value)} placeholder="bKash username" />
                <Input label="Password" type="password" value={form.bkash_tokenized_password || ""} onChange={(e) => updateField("bkash_tokenized_password", e.target.value)} placeholder="bKash password" />
              </div>
            </section>

            <label className="block text-sm font-semibold text-[#24324a] md:col-span-2">
              Checkout Notice
              <textarea
                className="mt-1.5 min-h-24 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
                value={form.payment_notice || ""}
                onChange={(e) => updateField("payment_notice", e.target.value)}
                placeholder="Example: Manual payments are verified before dispatch."
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save payment settings"}</Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">Checkout Preview</p>
            <h3 className="mt-2 text-lg font-semibold text-[#101827]">{enabledCount} method{enabledCount === 1 ? "" : "s"} enabled</h3>
            <div className="mt-4 space-y-3">
              {paymentOptions.length ? (
                paymentOptions.map((option) => (
                  <div key={option.method} className="rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#101827]">{option.title}</p>
                        <p className="mt-1 text-xs text-[#64748b]">{option.number || option.subtitle || "No number required"}</p>
                      </div>
                      {option.requires_proof && <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">Proof</span>}
                      {option.opens_url && <span className="rounded-full bg-pink-100 px-2 py-1 text-[11px] font-semibold text-pink-700">URL</span>}
                    </div>
                    {option.instructions && <p className="mt-2 text-xs text-[#53637a]">{option.instructions}</p>}
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-red-100 bg-red-50 p-3 text-sm text-red-700">No usable payment method is active.</div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 p-5 text-sm text-[#34534b]">
            <h3 className="font-semibold text-[#0f513f]">Order behavior</h3>
            <p className="mt-2">Disabled methods are rejected by the API, even if an old app version sends them.</p>
            <p className="mt-2">bKash and Nagad only appear when their toggle is on and a payment number is saved.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
