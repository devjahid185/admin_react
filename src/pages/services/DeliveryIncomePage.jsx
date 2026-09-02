import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultFilters = {
  payment_method: "",
  payment_status: "",
  status: "",
  date_from: "",
  date_to: "",
};

function money(value) {
  return `BDT ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    red: "border-red-200 bg-red-50 text-red-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    violet: "border-violet-200 bg-violet-50 text-violet-900",
  };
  return (
    <div className={`rounded-[16px] border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function ServiceCard({ row }) {
  return (
    <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ee0012]">{row.service_type}</p>
          <h3 className="mt-1 text-lg font-black capitalize text-[#101827]">{row.service_type} Delivery</h3>
        </div>
        <span className="rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-1.5 text-xs font-black text-[#53637a]">
          {row.orders_count || 0} orders
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Delivery Fee" value={money(row.delivery_fee_total)} tone="blue" />
        <StatCard label="Rider Payout" value={money(row.rider_payout_total)} tone="indigo" />
        <StatCard label="Restaurant Commission" value={money(row.restaurant_commission_total)} tone="violet" />
        <StatCard label="Owner Payable" value={money(row.restaurant_owner_payable_total)} tone="emerald" />
        <StatCard label="Admin Income" value={money(row.admin_total_income)} tone="red" />
      </div>
    </div>
  );
}

export default function DeliveryIncomePage({ token }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (String(value || "").trim()) params.set(key, String(value).trim());
      });
      const qs = params.toString();
      const data = await apiRequest(`/admin/delivery-income-summary${qs ? `?${qs}` : ""}`, { token });
      setSummary(data);
    } catch (err) {
      setError(err.message || "Unable to load delivery income summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, filters]);

  const totals = summary?.totals || {};
  const settings = summary?.settings || {};
  const methods = summary?.by_method || [];

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Finance</p>
            <h2 className="mt-1 text-2xl font-black text-[#101827]">Admin Delivery Income</h2>
            <p className="mt-1 text-sm text-[#64748b]">Delivery fee থেকে rider payout বাদ দিয়ে admin net income দেখুন।</p>
          </div>
          {loading && <span className="text-xs font-bold text-[#64748b]">Refreshing...</span>}
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
            Payment
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
              <option value="">All methods</option>
              <option value="cash_on_delivery">COD</option>
              <option value="manual_bkash">Manual bKash</option>
              <option value="manual_nagad">Manual Nagad</option>
              <option value="online">Online</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
            Payment Status
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.payment_status} onChange={(e) => update("payment_status", e.target.value)}>
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
            Status
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.status} onChange={(e) => update("status", e.target.value)}>
              <option value="">All</option>
              {["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"].map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
          <Input label="From" type="date" value={filters.date_from} onChange={(e) => update("date_from", e.target.value)} />
          <Input label="To" type="date" value={filters.date_to} onChange={(e) => update("date_to", e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={() => setFilters(defaultFilters)}>Clear filters</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
        <StatCard label="Orders" value={totals.orders_count || 0} />
        <StatCard label="Delivered" value={totals.delivered_orders_count || 0} tone="emerald" />
        <StatCard label="Grand Total" value={money(totals.grand_total)} />
        <StatCard label="Delivery Fee" value={money(totals.delivery_fee_total)} tone="blue" />
        <StatCard label="Rider Payout" value={money(totals.rider_payout_total)} tone="indigo" />
        <StatCard label="Delivery Income" value={money(totals.admin_delivery_income_total)} tone="red" />
        <StatCard label="Restaurant Commission" value={money(totals.restaurant_commission_total)} tone="violet" />
        <StatCard label="Total Admin Income" value={money(totals.admin_total_income)} tone="red" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Restaurant Owner Payable" value={money(totals.restaurant_owner_payable_total)} tone="emerald" />
        <StatCard label="COD Owner Due" value={money(totals.owner_settlement_due_total)} tone="amber" />
        <StatCard label="Manual Net Balance" value={money(totals.owner_payable_after_manual_total)} />
      </div>

      <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800">Active Rider Split Rule</p>
        <p className="mt-2 text-sm font-semibold text-emerald-950">
          Customer fixed charge {money(settings.fixed_charge)} থেকে rider পাবে {money(settings.rider_fixed_earning)}। Extra per KM {money(settings.per_km_charge)} থেকে rider পাবে {money(settings.rider_per_km_earning)}।
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {(summary?.by_service || []).map((row) => <ServiceCard key={row.service_type} row={row} />)}
      </div>

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-[#101827]">Payment Method Breakdown</h3>
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#edf1f6]">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#53637a]">
              <tr>
                <th className="px-3 py-3 text-left">Method</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Grand Total</th>
                <th className="px-3 py-3 text-right">Delivery Fee</th>
                <th className="px-3 py-3 text-right">Rider Payout</th>
                <th className="px-3 py-3 text-right">Restaurant Commission</th>
                <th className="px-3 py-3 text-right">Admin Income</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((row) => (
                <tr key={row.payment_method} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-3 font-bold capitalize text-[#111827]">{String(row.payment_method || "-").replace(/_/g, " ")}</td>
                  <td className="px-3 py-3 text-right">{row.orders_count}</td>
                  <td className="px-3 py-3 text-right">{money(row.grand_total)}</td>
                  <td className="px-3 py-3 text-right">{money(row.delivery_fee_total)}</td>
                  <td className="px-3 py-3 text-right">{money(row.rider_payout_total)}</td>
                  <td className="px-3 py-3 text-right">{money(row.restaurant_commission_total)}</td>
                  <td className="px-3 py-3 text-right font-black text-red-700">{money(row.admin_total_income)}</td>
                </tr>
              ))}
              {!methods.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-[#64748b]">No income data found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
