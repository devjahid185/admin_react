import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiRequest } from "../lib/api.js";
import { API_BASE } from "../lib/config.js";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../components/BulkDeleteBar.jsx";
import Button from "../components/Button.jsx";
import UsersPage from "./UsersPage.jsx";
import StaffManagementPage from "./StaffManagementPage.jsx";
import WorkersPage from "./services/WorkersPage.jsx";
import BusinessesPage from "./services/BusinessesPage.jsx";
import MarketplacePage from "./services/MarketplacePage.jsx";
import DoctorsPage from "./services/DoctorsPage.jsx";
import HospitalsPage from "./services/HospitalsPage.jsx";
import HotelsPage from "./services/HotelsPage.jsx";
import RestaurantsPage from "./services/RestaurantsPage.jsx";
import PropertyPage from "./services/PropertyPage.jsx";
import EducationPage from "./services/EducationPage.jsx";
import JobsPage from "./services/JobsPage.jsx";
import BloodPage from "./services/BloodPage.jsx";
import CourierPage from "./services/CourierPage.jsx";
import CarRentalPage from "./services/CarRentalPage.jsx";
import LaunchesPage from "./services/LaunchesPage.jsx";
import ElectricityPage from "./services/ElectricityPage.jsx";
import EmergencyPage from "./services/EmergencyPage.jsx";
import NewsPage from "./services/NewsPage.jsx";
import NoticesPage from "./services/NoticesPage.jsx";
import UpdatesPage from "./services/UpdatesPage.jsx";
import FaqsPage from "./services/FaqsPage.jsx";
import HomeBannersPage from "./services/HomeBannersPage.jsx";
import HomeServiceShortcutsPage from "./services/HomeServiceShortcutsPage.jsx";
import NotificationsPage from "./services/NotificationsPage.jsx";
import MessagesPage from "./services/MessagesPage.jsx";
import PaymentsPage from "./services/PaymentsPage.jsx";
import SmsSettingsPage from "./services/SmsSettingsPage.jsx";
import EmailSettingsPage from "./services/EmailSettingsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import ServicePage from "./services/ServicePage.jsx";
import FoodAdminPage from "./services/FoodAdminPage.jsx";
import FoodDeliverySettingsPage from "./services/FoodDeliverySettingsPage.jsx";
import MedicinePaymentSettingsPage from "./services/MedicinePaymentSettingsPage.jsx";
import RiderAdminPage from "./services/RiderAdminPage.jsx";
import RiderSettingsPage from "./services/RiderSettingsPage.jsx";
import SupportSettingsPage from "./services/SupportSettingsPage.jsx";
import MapSettingsPage from "./services/MapSettingsPage.jsx";
import AppVersionSettingsPage from "./services/AppVersionSettingsPage.jsx";
import DeliveryIncomePage from "./services/DeliveryIncomePage.jsx";
import AiSocialAutomationPage from "./services/AiSocialAutomationPage.jsx";

const MODULE_ALIASES = {
  ai_social: "ai-social",
  "ai-social-automation": "ai-social",
};

function normalizeModuleSlug(slug) {
  return MODULE_ALIASES[slug] || slug || "dashboard";
}

function moduleSlugFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/admin";
  if (path === "/admin" || path === "/") return "dashboard";
  if (path.startsWith("/admin/")) return normalizeModuleSlug(path.slice("/admin/".length));
  return "dashboard";
}

const DEFAULT_ADMIN_MODULES = [
  { name: "Dashboard", slug: "dashboard", group_name: "Core", route: "/admin" },
  { name: "Profile", slug: "profile", group_name: "Core", route: "/admin/profile" },
  { name: "Users", slug: "users", group_name: "Core", route: "/admin/users" },
  { name: "Staff Management", slug: "staff-management", group_name: "Core", route: "/admin/staff-management" },
  { name: "Home Banners", slug: "home-banners", group_name: "Engagement", route: "/admin/home-banners" },
  { name: "Home Services", slug: "home-service-shortcuts", group_name: "Engagement", route: "/admin/home-service-shortcuts" },
  { name: "AI Social Automation", slug: "ai-social", group_name: "Engagement", route: "/admin/ai-social" },
  { name: "Workers", slug: "workers", group_name: "Services", route: "/admin/workers" },
  { name: "Businesses", slug: "businesses", group_name: "Services", route: "/admin/businesses" },
  { name: "Marketplace", slug: "marketplace", group_name: "Services", route: "/admin/marketplace" },
  { name: "Jobs", slug: "jobs", group_name: "Services", route: "/admin/jobs" },
  { name: "Doctors", slug: "doctors", group_name: "Services", route: "/admin/doctors" },
  { name: "Hospitals", slug: "hospitals", group_name: "Services", route: "/admin/hospitals" },
  { name: "Hotels", slug: "hotels", group_name: "Services", route: "/admin/hotels" },
  { name: "Restaurants", slug: "restaurants", group_name: "Services", route: "/admin/restaurants" },
  { name: "Food Items", slug: "food-items", group_name: "Food Delivery", route: "/admin/food-items" },
  { name: "Food Categories", slug: "food-categories", group_name: "Food Delivery", route: "/admin/food-categories" },
  { name: "Food Banners", slug: "food-banners", group_name: "Food Delivery", route: "/admin/food-banners" },
  { name: "Food Orders", slug: "food-orders", group_name: "Food Delivery", route: "/admin/food-orders" },
  { name: "Food Coupons", slug: "food-coupons", group_name: "Food Delivery", route: "/admin/food-coupons" },
  { name: "Food Reviews", slug: "food-reviews", group_name: "Food Delivery", route: "/admin/food-reviews" },
  { name: "Delivery Settings", slug: "food-delivery-settings", group_name: "Food Delivery", route: "/admin/food-delivery-settings" },
  { name: "Medicine Items", slug: "medicine-items", group_name: "Medicine Delivery", route: "/admin/medicine-items" },
  { name: "Medicine Orders", slug: "medicine-orders", group_name: "Medicine Delivery", route: "/admin/medicine-orders" },
  { name: "Medicine Payments", slug: "medicine-payment-settings", group_name: "Medicine Delivery", route: "/admin/medicine-payment-settings" },
  { name: "Rider Management", slug: "riders", group_name: "Rider System", route: "/admin/riders" },
  { name: "Rider Settings", slug: "rider-settings", group_name: "Rider System", route: "/admin/rider-settings" },
  { name: "Income Reconciliation", slug: "delivery-income", group_name: "Finance", route: "/admin/delivery-income" },
  { name: "Property", slug: "property", group_name: "Services", route: "/admin/property" },
  { name: "Education", slug: "education", group_name: "Services", route: "/admin/education" },
  { name: "Blood Donation", slug: "blood", group_name: "Services", route: "/admin/blood" },
  { name: "Courier", slug: "courier", group_name: "Services", route: "/admin/courier" },
  { name: "Car Rental", slug: "car-rental", group_name: "Services", route: "/admin/car-rental" },
  { name: "Launch Services", slug: "launches", group_name: "Services", route: "/admin/launches" },
  { name: "Electricity Office", slug: "electricity", group_name: "Services", route: "/admin/electricity" },
  { name: "Emergency", slug: "emergency", group_name: "Content", route: "/admin/emergency" },
  { name: "News", slug: "news", group_name: "Content", route: "/admin/news" },
  { name: "Notices", slug: "notices", group_name: "Content", route: "/admin/notices" },
  { name: "Updates", slug: "updates", group_name: "Content", route: "/admin/updates" },
  { name: "FAQs", slug: "faqs", group_name: "Content", route: "/admin/faqs" },
  { name: "Notifications", slug: "notifications", group_name: "Engagement", route: "/admin/notifications" },
  { name: "Reviews", slug: "reviews", group_name: "Moderation", route: "/admin/reviews" },
  { name: "Reports", slug: "reports", group_name: "Moderation", route: "/admin/reports" },
  { name: "Messages", slug: "messages", group_name: "Moderation", route: "/admin/messages" },
  { name: "Payments", slug: "payments", group_name: "Finance", route: "/admin/payments" },
  { name: "SMS Settings", slug: "sms-settings", group_name: "System", route: "/admin/sms-settings" },
  { name: "Email Settings", slug: "email-settings", group_name: "System", route: "/admin/email-settings" },
  { name: "Map Settings", slug: "map-settings", group_name: "System", route: "/admin/map-settings" },
  { name: "Support Settings", slug: "support-settings", group_name: "System", route: "/admin/support-settings" },
  { name: "App Versions", slug: "app-version-settings", group_name: "System", route: "/admin/app-version-settings" },
];

function mergeAdminModules(apiModules = []) {
  const hidden = new Set(["rider-documents", "rider-wallet", "rider-support-tickets", "rider-ratings", "rider-locations"]);
  if (!apiModules.length) {
    return DEFAULT_ADMIN_MODULES.filter((item) => !hidden.has(item.slug));
  }
  const defaults = new Map(DEFAULT_ADMIN_MODULES.map((item) => [item.slug, item]));
  return apiModules.map((item) => {
    if (item?.slug && !hidden.has(item.slug)) {
      return { ...defaults.get(item.slug), ...item };
    }
    return null;
  }).filter(Boolean);
}

const compact = (value) => Number(value || 0).toLocaleString();
const money = (value) => `BDT ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const ADMIN_ALERT_STORAGE_KEY = "bv_admin_alert_counters";

const MONITORED_COUNTERS = [
  { key: "food_orders", label: "New food order", slug: "food-orders", type: "Order" },
  { key: "medicine_orders", label: "New medicine order", slug: "medicine-orders", type: "Order" },
  { key: "rider_requests", label: "New delivery request", slug: "delivery-income", type: "Delivery" },
  { key: "food_items", label: "New food item", slug: "food-items", type: "Food" },
  { key: "medicine_items", label: "New medicine item", slug: "medicine-items", type: "Medicine" },
  { key: "restaurants", label: "New restaurant", slug: "restaurants", type: "Food" },
  { key: "workers", label: "New worker service", slug: "workers", type: "Service" },
  { key: "businesses", label: "New business", slug: "businesses", type: "Service" },
  { key: "marketplace_items", label: "New marketplace item", slug: "marketplace", type: "Service" },
  { key: "jobs", label: "New job post", slug: "jobs", type: "Service" },
  { key: "doctors", label: "New doctor listing", slug: "doctors", type: "Service" },
  { key: "hospitals", label: "New hospital listing", slug: "hospitals", type: "Service" },
  { key: "hotels", label: "New hotel listing", slug: "hotels", type: "Service" },
  { key: "properties", label: "New property listing", slug: "property", type: "Service" },
  { key: "education", label: "New education listing", slug: "education", type: "Service" },
  { key: "car_rentals", label: "New car rental", slug: "car-rental", type: "Service" },
  { key: "launches", label: "New launch service", slug: "launches", type: "Service" },
  { key: "couriers", label: "New courier office", slug: "courier", type: "Service" },
  { key: "messages_total", label: "New message", slug: "messages", type: "Support" },
  { key: "reports_pending", label: "New pending report", slug: "reports", type: "Moderation" },
];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readStoredCounters() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_ALERT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredCounters(counters) {
  try {
    localStorage.setItem(ADMIN_ALERT_STORAGE_KEY, JSON.stringify(counters));
  } catch {}
}

function countersFromStats(stats = {}) {
  return MONITORED_COUNTERS.reduce((acc, item) => {
    acc[item.key] = Number(stats?.[item.key] || 0);
    return acc;
  }, {});
}

function createAlertTone(ctx) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.2, now + 0.08);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 5);
  master.connect(ctx.destination);

  [0, 0.45, 0.9, 1.35, 1.8, 2.35, 2.9, 3.45, 4].forEach((offset, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(index % 2 ? 740 : 520, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.55, now + offset + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.34);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + 0.38);
  });
}

async function fetchAdminStatsSilently(token) {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Unable to poll admin stats");
  return res.json();
}

function StatTile({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => item.slug && onOpen(item.slug)}
      className="rounded-[16px] border border-[#dfe6ef] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#64748b]">{item.label}</p>
          <p className="mt-3 text-2xl font-black text-[#050b18]">{item.money ? money(item.value) : compact(item.value)}</p>
          {item.note && <p className="mt-1 text-xs font-semibold text-[#64748b]">{item.note}</p>}
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-[13px] text-sm font-black ${item.danger ? "bg-red-50 text-[#ee0012]" : "bg-[#f1f5f9] text-[#24324a]"}`}>
          {item.icon || item.label.slice(0, 2)}
        </span>
      </div>
    </button>
  );
}

function MiniMetric({ label, value, note, slug, onOpen }) {
  const Wrapper = slug ? "button" : "div";
  const displayValue = typeof value === "string" ? value : compact(value);
  return (
    <Wrapper
      type={slug ? "button" : undefined}
      onClick={slug ? () => onOpen(slug) : undefined}
      className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] px-4 py-3 text-left transition hover:border-red-200 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#24324a]">{label}</p>
        <p className="text-sm font-black text-[#050b18]">{displayValue}</p>
      </div>
      {note && <p className="mt-1 text-xs text-[#8b98ab]">{note}</p>}
    </Wrapper>
  );
}

function StatusBars({ title, rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value || 0)));
  return (
    <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#101827]">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs font-bold text-[#64748b]">
              <span className="capitalize">{String(row.label || "unknown").replaceAll("_", " ")}</span>
              <span>{compact(row.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-[#eef2f7]">
              <div className="h-2 rounded-full bg-[#ee0012]" style={{ width: `${Math.max(4, (Number(row.value || 0) / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-[#8b98ab]">No data yet.</p>}
      </div>
    </div>
  );
}

function RecentList({ title, items = [], empty, render }) {
  return (
    <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-[#101827]">{title}</p>
      <ul className="mt-3 space-y-3 text-sm text-[#53637a]">
        {items.map(render)}
        {!items.length && <li className="text-[#8b98ab]">{empty}</li>}
      </ul>
    </div>
  );
}

function DashboardOverview({ stats, recent, onOpen }) {
  const charts = stats?.charts || {};
  const daily = charts.daily_visits || [];
  const monthly = charts.monthly_visits || [];
  const status = charts.status_breakdowns || {};
  const serviceTotals = charts.service_totals || [];
  const maxDaily = Math.max(1, ...daily.map((item) => Number(item.visits || 0) + Number(item.orders || 0) + Number(item.medicine_orders || 0)));
  const maxService = Math.max(1, ...serviceTotals.map((item) => Number(item.value || 0)));

  const topKpis = [
    { label: "Total Users", value: stats?.users, note: `${compact(stats?.new_users_today)} today / ${compact(stats?.new_users_month)} this month`, slug: "users", icon: "US" },
    { label: "Food Revenue", value: stats?.food_revenue_total, note: `${money(stats?.food_revenue_today)} today`, slug: "food-orders", icon: "FD", money: true },
    { label: "Medicine Revenue", value: stats?.medicine_revenue_total, note: `${compact(stats?.medicine_orders_pending)} active orders`, slug: "medicine-orders", icon: "MD", money: true },
    { label: "Riders Online", value: stats?.riders_online, note: `${compact(stats?.riders_active)} active / ${compact(stats?.riders_kyc_pending)} KYC pending`, slug: "riders", icon: "RD", danger: Number(stats?.riders_kyc_pending || 0) > 0 },
    { label: "Pending Food", value: stats?.food_orders_pending, note: `${compact(stats?.food_unassigned_orders)} unassigned`, slug: "food-orders", icon: "FO", danger: Number(stats?.food_orders_pending || 0) > 0 },
    { label: "Pending Medicine", value: stats?.medicine_orders_pending, note: `${compact(stats?.medicine_unassigned_orders)} unassigned`, slug: "medicine-orders", icon: "MO", danger: Number(stats?.medicine_orders_pending || 0) > 0 },
    { label: "SMS Failed", value: stats?.sms_failed, note: `${compact(stats?.sms_today)} SMS today`, slug: "sms-settings", icon: "SM", danger: Number(stats?.sms_failed || 0) > 0 },
    { label: "Open Support", value: Number(stats?.food_support_open || 0) + Number(stats?.rider_support_open || 0), note: "Food + rider tickets", slug: "support-settings", icon: "SP", danger: Number(stats?.food_support_open || 0) + Number(stats?.rider_support_open || 0) > 0 },
  ];

  const groups = [
    {
      title: "Food Delivery",
      items: [
        ["Orders", stats?.food_orders, "food-orders"],
        ["Today", stats?.food_orders_today, "food-orders"],
        ["Delivered", stats?.food_orders_delivered, "food-orders"],
        ["Cancelled", stats?.food_orders_cancelled, "food-orders"],
        ["Food Items", stats?.food_items, "food-items"],
        ["Available Items", stats?.food_items_available, "food-items"],
        ["Categories", stats?.food_categories, "food-categories"],
        ["Active Coupons", stats?.food_coupons_active, "food-coupons"],
        ["Food Carts", stats?.food_carts, "food-addresses"],
        ["Food Reviews", stats?.food_reviews, "food-reviews"],
      ],
    },
    {
      title: "Medicine Delivery",
      items: [
        ["Orders", stats?.medicine_orders, "medicine-orders"],
        ["Today", stats?.medicine_orders_today, "medicine-orders"],
        ["Delivered", stats?.medicine_orders_delivered, "medicine-orders"],
        ["Cancelled", stats?.medicine_orders_cancelled, "medicine-orders"],
        ["Items", stats?.medicine_items, "medicine-items"],
        ["Available", stats?.medicine_items_available, "medicine-items"],
        ["Promoted", stats?.medicine_items_promoted, "medicine-items"],
        ["Prescription", stats?.medicine_prescription_required, "medicine-items"],
        ["Carts", stats?.medicine_carts, "medicine-orders"],
        ["Delivery Fees", stats?.medicine_delivery_fees, "medicine-orders"],
      ],
    },
    {
      title: "Local Services",
      items: [
        ["Workers", stats?.workers, "workers"],
        ["Businesses", stats?.businesses, "businesses"],
        ["Marketplace", stats?.marketplace_items, "marketplace"],
        ["Jobs", stats?.jobs, "jobs"],
        ["Doctors", stats?.doctors, "doctors"],
        ["Hospitals", stats?.hospitals, "hospitals"],
        ["Hotels", stats?.hotels, "hotels"],
        ["Properties", stats?.properties, "property"],
        ["Education", stats?.education, "education"],
        ["Launch Routes", stats?.launches, "launches"],
        ["Couriers", stats?.couriers, "courier"],
        ["Car Rentals", stats?.car_rentals, "car-rental"],
      ],
    },
    {
      title: "System and Content",
      items: [
        ["Home Banners", stats?.home_banners_active, "home-banners"],
        ["Food Banners", stats?.food_banners_active, "food-banners"],
        ["Home Services", stats?.home_shortcuts_active, "home-service-shortcuts"],
        ["News", stats?.news, "news"],
        ["Notices", stats?.notices, "notices"],
        ["Updates", stats?.updates, "updates"],
        ["FAQs", stats?.faqs_active, "faqs"],
        ["Emergency", stats?.emergency_contacts, "emergency"],
        ["Notifications", stats?.notifications_total, "notifications"],
        ["Device Tokens", stats?.device_tokens, "notifications"],
        ["Messages", stats?.messages_total, "messages"],
        ["Reports Pending", stats?.reports_pending, "reports"],
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topKpis.map((item) => <StatTile key={item.label} item={item} onOpen={onOpen} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#101827]">14 day activity pulse</h3>
              <p className="text-sm text-[#64748b]">Visits, users, food orders, medicine orders and revenue trend.</p>
            </div>
            <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black text-red-700">Live DB</span>
          </div>
          <div className="mt-6 flex h-72 items-end gap-2 overflow-x-auto rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-4">
            {daily.length ? daily.map((item) => {
              const total = Number(item.visits || 0) + Number(item.orders || 0) + Number(item.medicine_orders || 0);
              const height = Math.max(8, (total / maxDaily) * 210);
              return (
                <div key={item.date || item.label} className="group flex min-w-[46px] flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-[11px] font-bold text-[#64748b]">{compact(total)}</div>
                  <div className="relative flex h-[220px] w-full items-end justify-center">
                    <div className="w-7 rounded-t-[8px] bg-[#ee0012] transition group-hover:w-9" style={{ height }} />
                    <div className="pointer-events-none absolute bottom-full mb-2 hidden w-44 rounded-[12px] border border-[#dfe6ef] bg-white p-3 text-left text-xs shadow-xl group-hover:block">
                      <p className="font-black text-[#101827]">{item.label}</p>
                      <p className="text-[#64748b]">Visits: {compact(item.visits)}</p>
                      <p className="text-[#64748b]">New users: {compact(item.users)}</p>
                      <p className="text-[#64748b]">Food orders: {compact(item.orders)}</p>
                      <p className="text-[#64748b]">Medicine orders: {compact(item.medicine_orders)}</p>
                      <p className="text-[#64748b]">Revenue: {money(item.revenue)}</p>
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-[10px] text-[#8b98ab]">{item.label}</div>
                </div>
              );
            }) : <div className="m-auto text-sm text-[#64748b]">Activity data will appear after users open the app.</div>}
          </div>
        </div>

        <div className="grid gap-4">
          <StatusBars title="Food order status" rows={status.food_orders || []} />
          <StatusBars title="Medicine order status" rows={status.medicine_orders || []} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatusBars title="Rider availability" rows={status.riders_by_availability || []} />
        <StatusBars title="Rider accounts" rows={status.riders_by_status || []} />
        <StatusBars title="SMS delivery" rows={status.sms || []} />
        <StatusBars title="Payments" rows={status.payments || []} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-[#101827]">{group.title}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.items.map(([label, value, slug]) => (
                <MiniMetric key={`${group.title}-${label}`} label={label} value={value} slug={slug} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-[#101827]">Service distribution</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {serviceTotals.map((service) => {
              const value = Number(service.value || 0);
              return (
                <button key={service.slug || service.label} type="button" onClick={() => service.slug && onOpen(service.slug)} className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-4 text-left transition hover:border-red-200 hover:bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[#101827]">{service.label}</p>
                    <p className="text-sm font-black text-[#050b18]">{compact(value)}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-[#ee0012]" style={{ width: `${Math.max(3, (value / maxService) * 100)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-[#101827]">Finance snapshot</h3>
          <div className="mt-4 grid gap-3">
            <MiniMetric label="Food delivery fees" value={money(stats?.food_delivery_fees)} note="Delivered food orders" />
            <MiniMetric label="Medicine delivery fees" value={money(stats?.medicine_delivery_fees)} note="Delivered medicine orders" />
            <MiniMetric label="Rider earnings" value={money(stats?.rider_earnings_total)} note="Wallet earning entries" />
            <MiniMetric label="Cash in hand" value={money(stats?.rider_cash_in_hand)} note="Rider collected cash" />
            <MiniMetric label="Successful payments" value={stats?.payments_paid} note={`${money(stats?.payments_total_amount)} total`} slug="payments" onOpen={onOpen} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <RecentList
          title="Recent app visits"
          items={recent?.visits || []}
          empty="No visit data yet."
          render={(visit) => (
            <li key={visit.id} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
              <p className="font-bold text-[#24324a]">{visit.user?.name || visit.user?.email || visit.user?.phone || "Guest user"}</p>
              <p className="text-xs text-[#8b98ab]">{visit.source || "app"} / {visit.path || "home"} / {formatDate(visit.visited_at)}</p>
            </li>
          )}
        />
        <RecentList
          title="Recent food orders"
          items={recent?.food_orders || []}
          empty="No food orders yet."
          render={(order) => (
            <li key={order.id} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
              <div className="flex justify-between gap-2"><p className="font-bold text-[#24324a]">{order.order_no || `Order #${order.id}`}</p><p className="text-xs font-black text-[#ee0012]">{order.status}</p></div>
              <p className="text-xs text-[#8b98ab]">{money(order.grand_total)} / {order.payment_status} / {formatDate(order.created_at)}</p>
            </li>
          )}
        />
        <RecentList
          title="Recent medicine orders"
          items={recent?.medicine_orders || []}
          empty="No medicine orders yet."
          render={(order) => (
            <li key={order.id} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
              <div className="flex justify-between gap-2"><p className="font-bold text-[#24324a]">{order.order_no || `Order #${order.id}`}</p><p className="text-xs font-black text-[#08745c]">{order.status}</p></div>
              <p className="text-xs text-[#8b98ab]">{money(order.grand_total)} / {order.payment_status} / {formatDate(order.created_at)}</p>
            </li>
          )}
        />
        <RecentList
          title="Recent riders and SMS"
          items={[...(recent?.riders || []).map((r) => ({ ...r, rowType: "rider" })), ...(recent?.sms_logs || []).map((s) => ({ ...s, rowType: "sms" }))].slice(0, 6)}
          empty="No rider or SMS activity yet."
          render={(item) => (
            <li key={`${item.rowType}-${item.id}`} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
              {item.rowType === "rider" ? (
                <>
                  <p className="font-bold text-[#24324a]">{item.name}</p>
                  <p className="text-xs text-[#8b98ab]">{item.account_status} / {item.availability_status} / KYC {item.kyc_status}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#24324a]">{item.phone || "SMS log"}</p>
                  <p className="text-xs text-[#8b98ab]">{item.purpose || "-"} / {item.status} / HTTP {item.http_status || "-"}</p>
                </>
              )}
            </li>
          )}
        />
      </section>
    </div>
  );
}

export default function DashboardPage({ token, onLogout }) {
  const [admin, setAdmin] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [activeModule, setActiveModuleState] = useState(moduleSlugFromPath);
  const [coreRecords, setCoreRecords] = useState([]);
  const [coreMeta, setCoreMeta] = useState(null);
  const [coreLoading, setCoreLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardRecent, setDashboardRecent] = useState(null);
  const [coreSelectedIds, setCoreSelectedIds] = useState([]);
  const [coreBulkDeleting, setCoreBulkDeleting] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  const [soundReady, setSoundReady] = useState(false);
  const [notificationReady, setNotificationReady] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const alertCountersRef = useRef(readStoredCounters());
  const audioRef = useRef(null);
  const titleTimerRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  const setActiveModule = (slug) => {
    const next = normalizeModuleSlug(slug);
    setActiveModuleState(next);
    const nextPath = next === "dashboard" ? "/admin" : `/admin/${next}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  useEffect(() => {
    const onPopState = () => setActiveModuleState(moduleSlugFromPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const unlockAudio = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioRef.current) audioRef.current = new AudioContextClass();
      if (audioRef.current.state === "suspended") await audioRef.current.resume();
      setSoundReady(audioRef.current.state === "running");
    } catch {}
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setNotificationReady(result === "granted");
      } catch {}
    } else {
      setNotificationReady(Notification.permission === "granted");
    }
  };

  const armAlerts = () => {
    unlockAudio();
    requestNotifications();
  };

  useEffect(() => {
    const handler = () => armAlerts();
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => () => {
    if (titleTimerRef.current) clearInterval(titleTimerRef.current);
    document.title = originalTitleRef.current;
  }, []);

  const fireLiveAlert = (changes) => {
    const primary = changes[0];
    const total = changes.reduce((sum, item) => sum + item.delta, 0);
    const title = changes.length === 1 ? primary.label : `${changes.length} new admin updates`;
    const message = changes.length === 1
      ? `${primary.delta} new ${primary.type.toLowerCase()} item detected.`
      : `${total} new records detected across orders, delivery and services.`;

    setLiveAlert({
      title,
      message,
      changes,
      createdAt: new Date().toISOString(),
    });

    if (audioRef.current?.state === "running") {
      createAlertTone(audioRef.current);
    }

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: "/favicon_bholavashi.png",
          tag: `bholavashi-admin-${primary.key}`,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          if (primary.slug) setActiveModule(primary.slug);
          notification.close();
        };
      } catch {}
    }

    if (titleTimerRef.current) clearInterval(titleTimerRef.current);
    let flip = false;
    titleTimerRef.current = setInterval(() => {
      flip = !flip;
      document.title = flip ? `(${total}) New update` : originalTitleRef.current;
    }, 900);
    setTimeout(() => {
      if (titleTimerRef.current) clearInterval(titleTimerRef.current);
      titleTimerRef.current = null;
      document.title = originalTitleRef.current;
    }, 15000);
  };

  const applyStatsPayload = (data, shouldDetectAlerts = false) => {
    const nextStats = { ...(data.stats || {}), charts: data.charts || {} };
    setDashboardStats(nextStats);
    setDashboardRecent(data.recent || null);

    const nextCounters = countersFromStats(nextStats);
    const previousCounters = alertCountersRef.current || {};
    const hasPrevious = MONITORED_COUNTERS.some((item) => previousCounters[item.key] !== undefined);
    const changes = shouldDetectAlerts && hasPrevious
      ? MONITORED_COUNTERS
          .map((item) => ({
            ...item,
            previous: Number(previousCounters[item.key] || 0),
            current: Number(nextCounters[item.key] || 0),
            delta: Number(nextCounters[item.key] || 0) - Number(previousCounters[item.key] || 0),
          }))
          .filter((item) => item.delta > 0)
      : [];

    alertCountersRef.current = nextCounters;
    saveStoredCounters(nextCounters);
    if (changes.length) fireLiveAlert(changes);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest("/admin/me", { token });
        setAdmin(data);
      } catch (err) {
        const message = err.message || "Unable to load data.";
        setError(message);
        if (message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("unauthorized")) {
          onLogout?.();
        }
      }
    };
    load();
  }, [token, onLogout]);

  useEffect(() => {
    const loadStats = async () => {
      if (activeModule !== "dashboard") return;
      try {
        const data = await apiRequest("/admin/stats", { token });
        setDashboardStats({ ...(data.stats || {}), charts: data.charts || {} });
        setDashboardRecent(data.recent || null);
      } catch (err) {
        setError(err.message || "Unable to load dashboard stats.");
      }
    };
    loadStats();
  }, [activeModule, token]);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const data = await fetchAdminStatsSilently(token);
        if (!stopped) applyStatsPayload(data, true);
      } catch (_) {}
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await apiRequest("/admin/modules", { token });
        setModules(mergeAdminModules(data.modules || []));
      } catch (_) {
        setModules(DEFAULT_ADMIN_MODULES);
      }
    };
    loadModules();
  }, [token]);

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!admin) {
        return;
      }
      setCoreLoading(true);
      try {
        if (activeModule === "admins") {
          const data = await apiRequest("/admin/admins", { token });
          setCoreRecords(data.admins || []);
          setCoreMeta(null);
          setCoreSelectedIds([]);
        } else if (activeModule === "reports") {
          const data = await apiRequest("/admin/reports", { token });
          setCoreRecords(data.data || []);
          setCoreMeta(data);
          setCoreSelectedIds([]);
        } else if (activeModule === "reviews") {
          const data = await apiRequest("/admin/reviews", { token });
          setCoreRecords(data.data || []);
          setCoreMeta(data);
          setCoreSelectedIds([]);
        } else {
          setCoreRecords([]);
          setCoreMeta(null);
          setCoreSelectedIds([]);
        }
      } catch (err) {
        setError(err.message || "Unable to load data.");
      } finally {
        setCoreLoading(false);
      }
    };
    fetchModuleData();
  }, [activeModule, token, admin]);

  const moduleTitle = useMemo(() => {
    if (activeModule === "users") return "Users";
    if (activeModule === "staff-management") return "Staff / User Management";
    if (activeModule === "reports") return "Reports";
    if (activeModule === "reviews") return "Reviews";
    if (activeModule === "dashboard") return "Dashboard";
    const match = modules.find((mod) => mod.slug === activeModule);
    return match?.name || "Dashboard";
  }, [activeModule, modules]);

  const deleteRow = async (path, id) => {
    await apiRequest(`${path}/${id}`, { method: "DELETE", token });
    setCoreRecords((prev) => prev.filter((r) => r.id !== id));
    setCoreSelectedIds((prev) => toggleSelectedId(prev, id, false));
  };

  const coreDeletePath = activeModule === "admins" ? "/admin/admins" : activeModule === "reports" ? "/admin/reports" : activeModule === "reviews" ? "/admin/reviews" : null;
  const coreSelectionState = visibleSelectionState(coreRecords, coreSelectedIds);
  const bulkDeleteCoreRows = async () => {
    const ids = Array.from(coreSelectedIds);
    if (!coreDeletePath || !ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected ${activeModule}? This action cannot be undone.`)) return;
    setCoreBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`${coreDeletePath}/${id}`, { method: "DELETE", token })));
      setCoreRecords((prev) => prev.filter((record) => !coreSelectedIds.includes(record.id)));
      setCoreSelectedIds([]);
    } catch (err) {
      setError(err.message || "Bulk delete failed.");
    } finally {
      setCoreBulkDeleting(false);
    }
  };

  const updateReport = async (id, status) => {
    await apiRequest(`/admin/reports/${id}`, { method: "PUT", token, body: { status } });
    setCoreRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const servicePageMap = {
    users: UsersPage,
    "staff-management": StaffManagementPage,
    profile: ProfilePage,
    workers: WorkersPage,
    businesses: BusinessesPage,
    marketplace: MarketplacePage,
    doctors: DoctorsPage,
    hospitals: HospitalsPage,
    hotels: HotelsPage,
    restaurants: RestaurantsPage,
    property: PropertyPage,
    education: EducationPage,
    jobs: JobsPage,
    blood: BloodPage,
    courier: CourierPage,
    "car-rental": CarRentalPage,
    launches: LaunchesPage,
    electricity: ElectricityPage,
    emergency: EmergencyPage,
    news: NewsPage,
    notices: NoticesPage,
    updates: UpdatesPage,
    faqs: FaqsPage,
    "home-banners": HomeBannersPage,
    "home-service-shortcuts": HomeServiceShortcutsPage,
    notifications: NotificationsPage,
    messages: MessagesPage,
    payments: PaymentsPage,
    "sms-settings": SmsSettingsPage,
    "email-settings": EmailSettingsPage,
    "food-delivery-settings": FoodDeliverySettingsPage,
    "medicine-payment-settings": MedicinePaymentSettingsPage,
    "map-settings": MapSettingsPage,
    "support-settings": SupportSettingsPage,
    "app-version-settings": AppVersionSettingsPage,
    "ai-social": AiSocialAutomationPage,
    "delivery-income": DeliveryIncomePage,
    "rider-settings": RiderSettingsPage,
    riders: RiderAdminPage,
  };
  const ServiceComponent = servicePageMap[activeModule] || null;
  const genericResourceModules = [
    "food-items",
    "food-categories",
    "food-banners",
    "food-orders",
    "food-coupons",
    "food-reviews",
    "food-addresses",
    "medicine-items",
    "medicine-orders",
  ];

  return (
    <DashboardLayout
      title={moduleTitle}
      subtitle={activeModule === "dashboard" ? "System overview" : ""}
      onLogout={onLogout}
      modules={modules}
      activeKey={activeModule}
      onSelectModule={(item) => setActiveModule(item.slug)}
    >
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {!soundReady && (
        <div className="mb-4 flex flex-col gap-3 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black">Live alert sound is waiting for browser permission.</p>
            <p className="mt-1 text-amber-800">Click enable once so new order, delivery and service alerts can play the 5 second tone.</p>
          </div>
          <Button type="button" variant="ghost" onClick={armAlerts}>Enable live alerts</Button>
        </div>
      )}
      {liveAlert && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-red-100 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#ee0012] to-[#ff5664] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">Live admin alert</p>
                  <h3 className="mt-2 text-2xl font-black">{liveAlert.title}</h3>
                  <p className="mt-1 text-sm text-white/85">{liveAlert.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveAlert(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/15 text-xl font-black hover:bg-white/25"
                  aria-label="Close alert"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {liveAlert.changes.slice(0, 6).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setLiveAlert(null);
                      if (item.slug) setActiveModule(item.slug);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] px-4 py-3 text-left transition hover:border-red-200 hover:bg-white"
                  >
                    <div>
                      <p className="font-black text-[#101827]">{item.label}</p>
                      <p className="text-xs font-semibold text-[#64748b]">{item.type} update detected</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-[#ee0012]">+{item.delta}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setLiveAlert(null)}>Close</Button>
                <Button
                  type="button"
                  onClick={() => {
                    const first = liveAlert.changes[0];
                    setLiveAlert(null);
                    if (first?.slug) setActiveModule(first.slug);
                  }}
                >
                  Open latest
                </Button>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#8b98ab]">
                Browser notification: {notificationReady ? "enabled" : "not enabled"} · Sound: {soundReady ? "enabled" : "needs one click"}
              </p>
            </div>
          </div>
        </div>
      )}
      {["admins", "reports", "reviews"].includes(activeModule) && (
        <div className="mb-4">
          <BulkDeleteBar
            selectedCount={coreSelectedIds.length}
            deleting={coreBulkDeleting}
            itemLabel={activeModule}
            onClear={() => setCoreSelectedIds([])}
            onDelete={bulkDeleteCoreRows}
          />
        </div>
      )}
      {activeModule === "dashboard" && (
        <DashboardOverview stats={dashboardStats} recent={dashboardRecent} onOpen={setActiveModule} />
      )}
      {activeModule === "admins" && (
        <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
          <table className="min-w-[640px] w-full text-xs md:text-sm">
            <thead className="bg-[#f8fafc] text-[#53637a]">
              <tr>
                <th className="w-10 px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={coreSelectionState.allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = coreSelectionState.someVisibleSelected;
                    }}
                    onChange={(e) => setCoreSelectedIds((prev) => toggleVisibleIds(prev, coreRecords, e.target.checked))}
                    aria-label="Select all visible admins"
                  />
                </th>
                <th className="text-left px-3 py-2 md:px-4">Name</th>
                <th className="text-left px-3 py-2 md:px-4">Email</th>
                <th className="text-left px-3 py-2 md:px-4">Super</th>
                <th className="text-right px-3 py-2 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coreRecords.map((a) => (
                <tr key={a.id} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 md:px-4">
                    <input
                      type="checkbox"
                      checked={coreSelectedIds.includes(a.id)}
                      onChange={(e) => setCoreSelectedIds((prev) => toggleSelectedId(prev, a.id, e.target.checked))}
                      aria-label={`Select admin ${a.id}`}
                    />
                  </td>
                  <td className="px-3 py-2 md:px-4">{a.name}</td>
                  <td className="px-3 py-2 md:px-4">{a.email}</td>
                  <td className="px-3 py-2 md:px-4">{a.is_super ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 md:px-4 md:text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => deleteRow("/admin/admins", a.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!coreRecords.length && (
                <tr>
                  <td className="px-4 py-4 text-[#64748b]" colSpan={5}>
                    {coreLoading ? "Loading..." : "No admins found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeModule === "reports" && (
        <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-[#f8fafc] text-[#53637a]">
              <tr>
                <th className="w-10 px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={coreSelectionState.allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = coreSelectionState.someVisibleSelected;
                    }}
                    onChange={(e) => setCoreSelectedIds((prev) => toggleVisibleIds(prev, coreRecords, e.target.checked))}
                    aria-label="Select all visible reports"
                  />
                </th>
                <th className="text-left px-3 py-2 md:px-4">Reporter</th>
                <th className="text-left px-3 py-2 md:px-4">Target</th>
                <th className="text-left px-3 py-2 md:px-4">Reason</th>
                <th className="text-left px-3 py-2 md:px-4">Status</th>
                <th className="text-right px-3 py-2 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coreRecords.map((r) => (
                <tr key={r.id} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 md:px-4">
                    <input
                      type="checkbox"
                      checked={coreSelectedIds.includes(r.id)}
                      onChange={(e) => setCoreSelectedIds((prev) => toggleSelectedId(prev, r.id, e.target.checked))}
                      aria-label={`Select report ${r.id}`}
                    />
                  </td>
                  <td className="px-3 py-2 md:px-4">{r.reporter_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.target_type} #{r.target_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.reason}</td>
                  <td className="px-3 py-2 md:px-4">
                    <select
                      className="rounded-[14px] border border-[#dfe6ef] px-2 py-1 text-sm"
                      value={r.status}
                      onChange={(e) => updateReport(r.id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 md:px-4 md:text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => deleteRow("/admin/reports", r.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!coreRecords.length && (
                <tr>
                  <td className="px-4 py-4 text-[#64748b]" colSpan={6}>
                    {coreLoading ? "Loading..." : "No reports found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeModule === "reviews" && (
        <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-[#f8fafc] text-[#53637a]">
              <tr>
                <th className="w-10 px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={coreSelectionState.allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = coreSelectionState.someVisibleSelected;
                    }}
                    onChange={(e) => setCoreSelectedIds((prev) => toggleVisibleIds(prev, coreRecords, e.target.checked))}
                    aria-label="Select all visible reviews"
                  />
                </th>
                <th className="text-left px-3 py-2 md:px-4">User</th>
                <th className="text-left px-3 py-2 md:px-4">Type</th>
                <th className="text-left px-3 py-2 md:px-4">Target</th>
                <th className="text-left px-3 py-2 md:px-4">Rating</th>
                <th className="text-left px-3 py-2 md:px-4">Comment</th>
                <th className="text-right px-3 py-2 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coreRecords.map((r) => (
                <tr key={r.id} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 md:px-4">
                    <input
                      type="checkbox"
                      checked={coreSelectedIds.includes(r.id)}
                      onChange={(e) => setCoreSelectedIds((prev) => toggleSelectedId(prev, r.id, e.target.checked))}
                      aria-label={`Select review ${r.id}`}
                    />
                  </td>
                  <td className="px-3 py-2 md:px-4">{r.user_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.type}</td>
                  <td className="px-3 py-2 md:px-4">#{r.target_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.rating}</td>
                  <td className="px-3 py-2 md:px-4">{r.comment || "-"}</td>
                  <td className="px-3 py-2 md:px-4 md:text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => deleteRow("/admin/reviews", r.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!coreRecords.length && (
                <tr>
                  <td className="px-4 py-4 text-[#64748b]" colSpan={7}>
                    {coreLoading ? "Loading..." : "No reviews found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!ServiceComponent &&
        !["dashboard", "admins", "reports", "reviews"].includes(activeModule) && (
          activeModule?.startsWith("food-") || activeModule?.startsWith("medicine-") ? (
            <FoodAdminPage token={token} resource={activeModule} />
          ) : genericResourceModules.includes(activeModule) ? (
            <ServicePage token={token} resource={activeModule} />
          ) : (
            <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6 text-sm text-[#53637a]">
              This module will be converted to a full form-based admin screen next.
            </div>
          )
        )}

      {ServiceComponent && <ServiceComponent token={token} onUnauthorized={onLogout} />}
    </DashboardLayout>
  );
}
