import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultForm = {
  is_enabled: true,
  charge_mode: "fixed",
  fixed_charge: 40,
  base_charge: 0,
  per_km_charge: 15,
  minimum_charge: 30,
  free_delivery_min_order: "",
  max_delivery_distance_km: "",
  store_lat: "",
  store_lng: "",
  note: "",
};

const numericFields = [
  "fixed_charge",
  "base_charge",
  "per_km_charge",
  "minimum_charge",
  "free_delivery_min_order",
  "max_delivery_distance_km",
  "store_lat",
  "store_lng",
];

export default function FoodDeliverySettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/food-delivery-settings", { token });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      const msg = err.message || "Unable to load delivery settings.";
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
      numericFields.forEach((key) => {
        payload[key] = payload[key] === "" || payload[key] === null ? null : Number(payload[key]);
      });
      const data = await apiRequest("/admin/food-delivery-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      setForm({ ...defaultForm, ...(data.settings || {}) });
    } catch (err) {
      setError(err.message || "Unable to save delivery settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-6 text-sm text-[#64748b] shadow-sm">Loading delivery settings...</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.75fr]">
        <form onSubmit={save} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Food Delivery</p>
              <h2 className="mt-1 text-xl font-semibold text-[#101827]">Delivery Charge Rules</h2>
              <p className="mt-1 text-sm text-[#64748b]">Only admins can change how delivery fee is calculated during checkout.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2">
              <span className="text-sm font-semibold text-[#24324a]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
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
              Charge Mode
              <select
                className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.charge_mode}
                onChange={(e) => updateField("charge_mode", e.target.value)}
              >
                <option value="fixed">Fixed rate</option>
                <option value="per_km">Per kilometer</option>
              </select>
            </label>
            <Input label="Fixed Charge" type="number" value={form.fixed_charge ?? ""} onChange={(e) => updateField("fixed_charge", e.target.value)} />
            <Input label="Base Charge" type="number" value={form.base_charge ?? ""} onChange={(e) => updateField("base_charge", e.target.value)} />
            <Input label="Per KM Charge" type="number" value={form.per_km_charge ?? ""} onChange={(e) => updateField("per_km_charge", e.target.value)} />
            <Input label="Minimum Charge" type="number" value={form.minimum_charge ?? ""} onChange={(e) => updateField("minimum_charge", e.target.value)} />
            <Input label="Free Delivery Minimum Order" type="number" value={form.free_delivery_min_order ?? ""} onChange={(e) => updateField("free_delivery_min_order", e.target.value)} placeholder="Optional" />
            <Input label="Max Delivery Distance (KM)" type="number" value={form.max_delivery_distance_km ?? ""} onChange={(e) => updateField("max_delivery_distance_km", e.target.value)} placeholder="Optional" />
            <Input label="Fallback Store Latitude" type="number" value={form.store_lat ?? ""} onChange={(e) => updateField("store_lat", e.target.value)} placeholder="Optional" />
            <Input label="Fallback Store Longitude" type="number" value={form.store_lng ?? ""} onChange={(e) => updateField("store_lng", e.target.value)} placeholder="Optional" />
            <label className="block text-sm font-medium text-[#24324a] md:col-span-2">
              Internal Note
              <textarea
                className="mt-1 min-h-24 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700/15"
                value={form.note || ""}
                onChange={(e) => updateField("note", e.target.value)}
                placeholder="Example: Fixed rate for Bhola Sadar, per-KM outside city."
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save delivery settings"}</Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[#101827]">How checkout uses this</h3>
            <div className="mt-4 space-y-3 text-sm text-[#53637a]">
              <p>User must tap current location before placing a delivery order.</p>
              <p>Admin receives saved latitude, longitude and a Google Maps link in the order record.</p>
              <p>Per-KM mode uses restaurant coordinates first. If missing, fallback store coordinates are used.</p>
            </div>
          </div>

          <div className="rounded-[16px] border border-red-100 bg-red-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">Current Rule</p>
            <h3 className="mt-2 text-lg font-semibold text-[#101827]">{form.charge_mode === "fixed" ? "Fixed delivery fee" : "Distance based fee"}</h3>
            <p className="mt-2 text-sm text-[#53637a]">
              {form.charge_mode === "fixed"
                ? `Every delivery order gets BDT ${form.fixed_charge || 0} delivery charge.`
                : `Fee = base ${form.base_charge || 0} + distance x ${form.per_km_charge || 0}, minimum ${form.minimum_charge || 0}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
