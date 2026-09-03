import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest } from "../../lib/api.js";

const defaultFilters = {
  service: "",
  payment_method: "",
  payment_status: "",
  status: "",
  date_from: "",
  date_to: "",
};

const serviceTabs = [
  { key: "", label: "All" },
  { key: "food", label: "Food" },
  { key: "medicine", label: "Medicine" },
];

function money(value) {
  return `BDT ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, tone = "slate", note = "" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    violet: "border-violet-200 bg-violet-50 text-violet-900",
  };
  return (
    <div className={`rounded-[16px] border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-65">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {note ? <p className="mt-1 text-xs font-semibold opacity-70">{note}</p> : null}
    </div>
  );
}

function FilterLabel({ label, children }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
      {label}
      {children}
    </label>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[12px] bg-[#f8fafc] p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{label}</div>
      <div className="mt-1 text-base font-black text-[#111827]">{value}</div>
    </div>
  );
}

function ServiceCard({ row, active }) {
  return (
    <div className={`rounded-[18px] border bg-white p-5 shadow-sm ${active ? "border-rose-200 ring-4 ring-rose-500/5" : "border-[#dfe6ef]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#64748b]">{row.service_type}</p>
          <h3 className="mt-1 text-lg font-black capitalize text-[#101827]">{row.service_type} reconciliation</h3>
        </div>
        <span className="rounded-[12px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-1.5 text-xs font-black text-[#53637a]">
          {row.orders_count || 0} orders
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MiniMetric label="Grand Total" value={money(row.grand_total)} />
        <MiniMetric label="Delivery Fee" value={money(row.delivery_fee_total)} />
        <MiniMetric label="Rider Payout" value={money(row.rider_payout_total)} />
        <MiniMetric label="Admin Delivery" value={money(row.admin_delivery_income_total)} />
        <MiniMetric label="Commission" value={money(row.restaurant_commission_total)} />
        <MiniMetric label="Admin Total" value={money(row.admin_total_income)} />
      </div>
    </div>
  );
}

function CompactTable({ title, columns, rows, emptyText }) {
  return (
    <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-[#101827]">{title}</h3>
      <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#edf1f6]">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#53637a]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-3 ${column.right ? "text-right" : "text-left"}`}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key || index} className="border-t border-[#edf1f6]">
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 ${column.right ? "text-right" : "text-left"} ${column.bold ? "font-black text-[#111827]" : ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-[#64748b]">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
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
      setError(err.message || "Unable to load income reconciliation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, filters]);

  const totals = summary?.totals || {};
  const settings = summary?.settings || {};
  const services = summary?.by_service || [];
  const methods = summary?.by_method || [];
  const statuses = summary?.by_status || [];
  const riders = summary?.by_rider || [];
  const daily = summary?.daily || [];

  const settlementGap = Number(totals.owner_payable_after_manual_total || 0);
  const riderGap = Number(totals.rider_payout_total || 0) - Number(totals.cash_collected_total || 0);
  const maxDailyIncome = useMemo(() => Math.max(1, ...daily.map((row) => Number(row.admin_total_income || 0))), [daily]);

  const exportSummary = () => {
    downloadCsv("income-reconciliation.csv", [
      ["Metric", "Value"],
      ["Orders", totals.orders_count || 0],
      ["Grand Total", totals.grand_total || 0],
      ["Delivery Fee", totals.delivery_fee_total || 0],
      ["Rider Payout", totals.rider_payout_total || 0],
      ["Admin Delivery Income", totals.admin_delivery_income_total || 0],
      ["Restaurant Commission", totals.restaurant_commission_total || 0],
      ["Total Admin Income", totals.admin_total_income || 0],
      ["Owner Payable", totals.restaurant_owner_payable_total || 0],
      ["Cash Collected", totals.cash_collected_total || 0],
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Finance</p>
            <h2 className="mt-1 text-2xl font-black text-[#101827]">Income Reconciliation</h2>
            <p className="mt-1 text-sm text-[#64748b]">Food and medicine delivery charge, rider payout, commission and admin income in one clean ledger.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => update("service", tab.key)}
                className={`rounded-[12px] border px-4 py-2 text-sm font-black transition ${
                  filters.service === tab.key ? "border-[#ee0012] bg-[#ee0012] text-white" : "border-[#dfe6ef] bg-white text-[#334155] hover:bg-[#f8fafc]"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <Button variant="ghost" onClick={load}>{loading ? "Refreshing..." : "Refresh"}</Button>
            <Button onClick={exportSummary}>Export CSV</Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <FilterLabel label="Payment">
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
              <option value="">All methods</option>
              <option value="cash_on_delivery">COD</option>
              <option value="manual_bkash">Manual bKash</option>
              <option value="manual_nagad">Manual Nagad</option>
              <option value="bkash_tokenized">bKash Checkout</option>
              <option value="online">Online</option>
            </select>
          </FilterLabel>
          <FilterLabel label="Payment Status">
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.payment_status} onChange={(e) => update("payment_status", e.target.value)}>
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </FilterLabel>
          <FilterLabel label="Order Status">
            <select className="mt-1 w-full rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" value={filters.status} onChange={(e) => update("status", e.target.value)}>
              <option value="">All</option>
              {["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"].map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FilterLabel>
          <Input label="From" type="date" value={filters.date_from} onChange={(e) => update("date_from", e.target.value)} />
          <Input label="To" type="date" value={filters.date_to} onChange={(e) => update("date_to", e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={() => setFilters(defaultFilters)}>Clear filters</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Orders" value={totals.orders_count || 0} note={`${totals.delivered_orders_count || 0} delivered`} />
        <StatCard label="Grand Total" value={money(totals.grand_total)} />
        <StatCard label="Delivery Fee" value={money(totals.delivery_fee_total)} tone="blue" />
        <StatCard label="Rider Payout" value={money(totals.rider_payout_total)} tone="indigo" />
        <StatCard label="Admin Delivery" value={money(totals.admin_delivery_income_total)} tone="red" />
        <StatCard label="Admin Total" value={money(totals.admin_total_income)} tone="red" note="Delivery + commission" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Restaurant Commission" value={money(totals.restaurant_commission_total)} tone="violet" />
        <StatCard label="Owner Payable" value={money(totals.restaurant_owner_payable_total)} tone="emerald" />
        <StatCard label="Cash Collected" value={money(totals.cash_collected_total)} tone="amber" />
        <StatCard label="Unpaid / Unassigned" value={`${totals.unpaid_orders_count || 0} / ${totals.unassigned_orders_count || 0}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,0.78fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((row) => <ServiceCard key={row.service_type} row={row} active={filters.service === row.service_type} />)}
        </div>
        <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#64748b]">Active Split Rule</p>
          <h3 className="mt-1 text-lg font-black text-[#101827]">Delivery charge sharing</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Customer Fixed" value={money(settings.fixed_charge)} />
            <MiniMetric label="Rider From Fixed" value={money(settings.rider_fixed_earning)} />
            <MiniMetric label="Customer Per KM" value={money(settings.per_km_charge)} />
            <MiniMetric label="Rider Per KM" value={money(settings.rider_per_km_earning)} />
          </div>
          <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Settlement gap: {money(settlementGap)}. Rider net payable estimate after cash collection: {money(riderGap)}.
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#101827]">Daily Admin Income Trend</h3>
          <span className="text-xs font-bold text-[#64748b]">{daily.length} days</span>
        </div>
        <div className="mt-4 space-y-3">
          {daily.slice(-14).map((row) => (
            <div key={row.date} className="grid gap-3 md:grid-cols-[130px,1fr,150px] md:items-center">
              <div className="text-sm font-black text-[#111827]">{row.date}</div>
              <div className="h-3 overflow-hidden rounded-full bg-[#eef2f7]">
                <div className="h-full rounded-full bg-[#ee0012]" style={{ width: `${Math.max(4, (Number(row.admin_total_income || 0) / maxDailyIncome) * 100)}%` }} />
              </div>
              <div className="text-right text-sm font-black text-[#111827]">{money(row.admin_total_income)}</div>
            </div>
          ))}
          {!daily.length && <div className="py-8 text-center text-sm text-[#64748b]">No daily data found.</div>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CompactTable
          title="Payment Method Breakdown"
          emptyText="No payment method data found."
          columns={[
            { key: "payment_method", label: "Method", render: (row) => String(row.payment_method || "-").replace(/_/g, " ") },
            { key: "orders_count", label: "Orders", right: true },
            { key: "grand_total", label: "Grand Total", right: true, render: (row) => money(row.grand_total) },
            { key: "delivery_fee_total", label: "Delivery Fee", right: true, render: (row) => money(row.delivery_fee_total) },
            { key: "rider_payout_total", label: "Rider", right: true, render: (row) => money(row.rider_payout_total) },
            { key: "admin_total_income", label: "Admin", right: true, bold: true, render: (row) => money(row.admin_total_income) },
          ]}
          rows={methods}
        />
        <CompactTable
          title="Order Status Breakdown"
          emptyText="No order status data found."
          columns={[
            { key: "status", label: "Status", render: (row) => String(row.status || "-").replace(/_/g, " ") },
            { key: "orders_count", label: "Orders", right: true },
            { key: "grand_total", label: "Grand Total", right: true, render: (row) => money(row.grand_total) },
            { key: "rider_payout_total", label: "Rider", right: true, render: (row) => money(row.rider_payout_total) },
            { key: "admin_total_income", label: "Admin", right: true, bold: true, render: (row) => money(row.admin_total_income) },
          ]}
          rows={statuses}
        />
      </div>

      <CompactTable
        title="Rider Payout Reconciliation"
        emptyText="No rider payout data found."
        columns={[
          { key: "rider_name", label: "Rider", render: (row) => <div><div className="font-black text-[#111827]">{row.rider_name}</div><div className="text-xs text-[#64748b]">{row.rider_phone || "-"}</div></div> },
          { key: "orders_count", label: "Orders", right: true },
          { key: "cash_collected_total", label: "Cash Collected", right: true, render: (row) => money(row.cash_collected_total) },
          { key: "delivery_fee_total", label: "Delivery Fee", right: true, render: (row) => money(row.delivery_fee_total) },
          { key: "rider_payout_total", label: "Rider Payout", right: true, bold: true, render: (row) => money(row.rider_payout_total) },
          { key: "admin_delivery_income_total", label: "Admin Delivery", right: true, render: (row) => money(row.admin_delivery_income_total) },
        ]}
        rows={riders}
      />
    </div>
  );
}
