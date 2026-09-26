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

const CARD = "rounded-2xl border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
const TD = "px-4 py-3 text-[#374151]";
const DONUT = ["#ee0012", "#111827", "#f87171", "#6b7280", "#fca5a5", "#d1d5db"];
const SERIES = [
  { key: "visits", label: "Visits", color: "#ee0012" },
  { key: "users", label: "New users", color: "#111827" },
  { key: "orders", label: "Food orders", color: "#f87171" },
  { key: "medicine_orders", label: "Medicine orders", color: "#9ca3af" },
];

const DASH_CSS = `
@keyframes dashRise{from{opacity:0;transform:translateY(14px)}to{opacity:1}}
@keyframes dashFade{from{opacity:0}to{opacity:1}}
@keyframes dashPop{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1}}
@keyframes dashDraw{to{stroke-dashoffset:0}}
@keyframes dashGrowY{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes dashGrowX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes dashRing{0%{box-shadow:0 0 0 0 rgba(238,0,18,.45)}100%{box-shadow:0 0 0 10px rgba(238,0,18,0)}}
.dash-rise{opacity:0;animation:dashRise .55s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.dash-fade{animation:dashFade .25s ease both}
.dash-pop{animation:dashPop .35s cubic-bezier(.2,.8,.2,1) both}
.dash-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:dashDraw 1.1s ease-out var(--d,0ms) forwards}
.dash-growy{transform-origin:bottom;animation:dashGrowY .7s cubic-bezier(.2,.8,.2,1) var(--d,0ms) both}
.dash-growx{transform-origin:left;animation:dashGrowX .8s cubic-bezier(.2,.8,.2,1) var(--d,0ms) both}
.dash-ring{animation:dashRing 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){.dash-rise,.dash-fade,.dash-pop,.dash-draw,.dash-growy,.dash-growx,.dash-ring{animation:none!important;opacity:1!important;stroke-dashoffset:0!important}}
`;

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const end = Number(target || 0);
    const start = from.current;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = end;
      setVal(end);
      return undefined;
    }
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const cur = start + (end - start) * (1 - Math.pow(1 - p, 3));
      from.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function Count({ value, isMoney }) {
  const v = Math.round(useCountUp(value));
  return isMoney ? money(v) : compact(v);
}

function Panel({ title, subtitle, action, children, className = "", delay = 0 }) {
  return (
    <section className={`dash-rise ${CARD} p-5 ${className}`} style={{ "--d": `${delay}ms` }}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#111]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#6b7280]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Spark({ data = [] }) {
  if (data.length < 2) return null;
  const w = 72, h = 26, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke="#ee0012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="dash-draw" />
    </svg>
  );
}

function StatTile({ item, onOpen, index = 0 }) {
  return (
    <button
      type="button"
      onClick={() => item.slug && onOpen(item.slug)}
      style={{ "--d": `${index * 60}ms` }}
      className={`dash-rise group text-left ${CARD} p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#ee0012]/40 hover:shadow-[0_10px_28px_rgba(238,0,18,0.09)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{item.label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-[11px] font-bold ${item.danger ? "dash-ring bg-[#ee0012] text-white" : "bg-[#fef2f2] text-[#ee0012]"}`}>
          {item.icon || item.label.slice(0, 2)}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight text-[#111]">
        <Count value={item.value} isMoney={item.money} />
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-[#6b7280]">{item.note}</p>
        <Spark data={item.spark} />
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
      className={`w-full rounded-xl bg-[#fafafa] px-3.5 py-2.5 text-left transition ${slug ? "hover:bg-[#fef2f2] hover:text-[#ee0012]" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[#4b5563]">{label}</p>
        <p className="text-sm font-bold text-[#111]">{displayValue}</p>
      </div>
      {note && <p className="mt-0.5 text-[11px] text-[#9ca3af]">{note}</p>}
    </Wrapper>
  );
}

function StatusDonut({ title, rows = [], delay = 0 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
  const R = 38, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <Panel title={title} delay={delay}>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#f3f4f6" strokeWidth="12" />
            {total > 0 && rows.map((row, i) => {
              const len = (Number(row.value || 0) / total) * C;
              const seg = (
                <circle
                  key={row.label}
                  cx="50" cy="50" r={R} fill="none"
                  stroke={DONUT[i % DONUT.length]} strokeWidth="12"
                  strokeDasharray={`${ready ? Math.max(0, len - 1.5) : 0} ${C}`}
                  strokeDashoffset={-acc}
                  style={{ transition: `stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1) ${i * 90}ms` }}
                />
              );
              acc += len;
              return seg;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-lg font-extrabold leading-none text-[#111]"><Count value={total} /></p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Total</p>
            </div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {rows.map((row, i) => (
            <li key={row.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-[#4b5563]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
                <span className="truncate capitalize">{String(row.label || "unknown").replaceAll("_", " ")}</span>
              </span>
              <span className="font-bold text-[#111]">{compact(row.value)}</span>
            </li>
          ))}
          {!rows.length && <li className="text-sm text-[#9ca3af]">No data yet.</li>}
        </ul>
      </div>
    </Panel>
  );
}

function ActivityChart({ daily }) {
  const [on, setOn] = useState(["visits", "orders", "medicine_orders"]);
  const [hover, setHover] = useState(null);
  if (!daily.length) {
    return <div className="grid h-64 place-items-center rounded-xl bg-[#fafafa] text-sm text-[#6b7280]">Activity data will appear after users open the app.</div>;
  }
  const W = 640, H = 260, L = 38, R = 12, T = 12, B = 26;
  const active = SERIES.filter((s) => on.includes(s.key));
  const max = Math.max(1, ...daily.flatMap((d) => active.map((s) => Number(d[s.key] || 0))));
  const iw = W - L - R, ih = H - T - B;
  const x = (i) => L + (daily.length < 2 ? iw / 2 : (i / (daily.length - 1)) * iw);
  const y = (v) => T + ih - (Number(v || 0) / max) * ih;
  const line = (k) => daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  const step = Math.ceil(daily.length / 7);
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(daily.length - 1, Math.round(((px - L) / iw) * (daily.length - 1)))));
  };
  const h = hover !== null ? daily[hover] : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {SERIES.map((s) => {
          const isOn = on.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setOn((p) => (isOn ? (p.length > 1 ? p.filter((k) => k !== s.key) : p) : [...p, s.key]))}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${isOn ? "border-[#111] bg-white text-[#111]" : "border-[#ececec] bg-[#fafafa] text-[#9ca3af]"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: isOn ? s.color : "#d1d5db" }} />
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseMove={move} onMouseLeave={() => setHover(null)}>
          {[0, 1, 2, 3, 4].map((t) => {
            const v = (max * t) / 4;
            return (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#f0f0f0" />
                <text x={L - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{compact(Math.round(v))}</text>
              </g>
            );
          })}
          {daily.map((d, i) => i % step === 0 && (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
          ))}
          {active[0] && (
            <path d={`${line(active[0].key)} L${x(daily.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={active[0].color} fillOpacity="0.07" className="dash-fade" />
          )}
          {active.map((s, i) => (
            <path key={s.key} d={line(s.key)} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="dash-draw" style={{ "--d": `${i * 120}ms` }} />
          ))}
          {h && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={T + ih} stroke="#ee0012" strokeDasharray="3 3" strokeOpacity=".5" />
              {active.map((s) => <circle key={s.key} cx={x(hover)} cy={y(h[s.key])} r="4" fill="#fff" stroke={s.color} strokeWidth="2" />)}
            </>
          )}
        </svg>
        {h && (
          <div className="pointer-events-none absolute top-2 w-44 -translate-x-1/2 rounded-xl border border-[#ececec] bg-white p-3 text-xs shadow-lg" style={{ left: `${Math.min(82, Math.max(18, (x(hover) / W) * 100))}%` }}>
            <p className="mb-1.5 font-bold text-[#111]">{h.label}</p>
            {active.map((s) => (
              <p key={s.key} className="flex justify-between text-[#6b7280]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
                <b className="text-[#111]">{compact(h[s.key])}</b>
              </p>
            ))}
            <p className="mt-1.5 flex justify-between border-t border-[#f3f4f6] pt-1.5 text-[#6b7280]">Revenue <b className="text-[#ee0012]">{money(h.revenue)}</b></p>
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueBars({ daily }) {
  if (!daily.length) return <div className="grid h-48 place-items-center rounded-xl bg-[#fafafa] text-sm text-[#6b7280]">No revenue data yet.</div>;
  const max = Math.max(1, ...daily.map((d) => Number(d.revenue || 0)));
  const total = daily.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
  return (
    <div>
      <p className="text-2xl font-extrabold text-[#111]"><Count value={total} isMoney /></p>
      <p className="text-xs text-[#6b7280]">Total, last {daily.length} days</p>
      <div className="mt-5 flex h-44 items-end gap-1.5">
        {daily.map((d, i) => {
          const v = Number(d.revenue || 0);
          const last = i === daily.length - 1;
          return (
            <div key={d.date || d.label} title={`${d.label}: ${money(v)}`} className="group flex h-full flex-1 items-end">
              <div className={`dash-growy w-full rounded-t-md transition-colors ${last ? "bg-[#ee0012]" : "bg-[#fbc4c8] group-hover:bg-[#ee0012]"}`} style={{ height: `${Math.max(3, (v / max) * 100)}%`, "--d": `${i * 40}ms` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[#9ca3af]">
        <span>{daily[0].label}</span>
        <span>{daily[daily.length - 1].label}</span>
      </div>
    </div>
  );
}

function FeedItem({ title, meta, badge, dark }) {
  return (
    <li className="flex gap-3 rounded-xl px-2 py-2 transition hover:bg-[#fafafa]">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ee0012]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[#111]">{title}</p>
          {badge && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${dark ? "bg-[#f3f4f6] text-[#374151]" : "bg-[#fef2f2] text-[#ee0012]"}`}>{badge}</span>}
        </div>
        <p className="truncate text-xs text-[#9ca3af]">{meta}</p>
      </div>
    </li>
  );
}

function RecentList({ title, items = [], empty, render, delay = 0 }) {
  return (
    <Panel title={title} delay={delay}>
      <ul className="space-y-1">
        {items.map(render)}
        {!items.length && <li className="px-2 py-4 text-sm text-[#9ca3af]">{empty}</li>}
      </ul>
    </Panel>
  );
}

function DataTable({ label, headers, records, selectedIds, setSelectedIds, selection, loading, renderCells }) {
  return (
    <div className={`dash-rise overflow-x-auto ${CARD}`}>
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-[#f0f0f0] bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#6b7280]">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#ee0012]"
                checked={selection.allVisibleSelected}
                ref={(input) => {
                  if (input) input.indeterminate = selection.someVisibleSelected;
                }}
                onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                aria-label={`Select all visible ${label}s`}
              />
            </th>
            {headers.map((name, i) => (
              <th key={name} className={`px-4 py-3 font-semibold ${i === headers.length - 1 ? "text-right" : "text-left"}`}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-[#f3f4f6] transition hover:bg-[#fef2f2]/60">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ee0012]"
                  checked={selectedIds.includes(r.id)}
                  onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, r.id, e.target.checked))}
                  aria-label={`Select ${label} ${r.id}`}
                />
              </td>
              {renderCells(r)}
            </tr>
          ))}
          {!records.length && (
            <tr>
              <td className="px-4 py-10 text-center text-sm text-[#9ca3af]" colSpan={headers.length + 1}>
                {loading ? "Loading..." : `No ${label}s found.`}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DashboardOverview({ stats, recent, onOpen }) {
  const charts = stats?.charts || {};
  const daily = charts.daily_visits || [];
  const monthly = charts.monthly_visits || [];
  const status = charts.status_breakdowns || {};
  const serviceTotals = charts.service_totals || [];
  const spark = (key) => daily.map((item) => Number(item[key] || 0));
  const maxService = Math.max(1, ...serviceTotals.map((item) => Number(item.value || 0)));

  const topKpis = [
    { label: "Total Users", value: stats?.users, note: `${compact(stats?.new_users_today)} today / ${compact(stats?.new_users_month)} this month`, slug: "users", icon: "US", spark: spark("users") },
    { label: "Food Revenue", value: stats?.food_revenue_total, note: `${money(stats?.food_revenue_today)} today`, slug: "food-orders", icon: "FD", money: true, spark: spark("revenue") },
    { label: "Medicine Revenue", value: stats?.medicine_revenue_total, note: `${compact(stats?.medicine_orders_pending)} active orders`, slug: "medicine-orders", icon: "MD", money: true, spark: spark("medicine_orders") },
    { label: "Riders Online", value: stats?.riders_online, note: `${compact(stats?.riders_active)} active / ${compact(stats?.riders_kyc_pending)} KYC pending`, slug: "riders", icon: "RD", danger: Number(stats?.riders_kyc_pending || 0) > 0 },
    { label: "Pending Food", value: stats?.food_orders_pending, note: `${compact(stats?.food_unassigned_orders)} unassigned`, slug: "food-orders", icon: "FO", spark: spark("orders"), danger: Number(stats?.food_orders_pending || 0) > 0 },
    { label: "Pending Medicine", value: stats?.medicine_orders_pending, note: `${compact(stats?.medicine_unassigned_orders)} unassigned`, slug: "medicine-orders", icon: "MO", spark: spark("medicine_orders"), danger: Number(stats?.medicine_orders_pending || 0) > 0 },
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
      <div className="dash-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#111]">Overview</h2>
          <p className="text-sm text-[#6b7280]">Real-time performance across delivery, services and system health.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151]">
          <span className="dash-ring h-2 w-2 rounded-full bg-[#ee0012]" />
          Live · refreshes every 5s
        </span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topKpis.map((item, i) => <StatTile key={item.label} item={item} index={i} onOpen={onOpen} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr,1fr]">
        <Panel
          title="14 day activity"
          subtitle="Visits, users and orders per day. Hover the chart for details."
          delay={200}
          action={<span className="rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-bold text-[#ee0012]">Live DB</span>}
        >
          <ActivityChart daily={daily} />
        </Panel>
        <Panel title="Revenue trend" subtitle="Daily revenue" delay={260}>
          <RevenueBars daily={daily} />
        </Panel>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatusDonut title="Food order status" rows={status.food_orders || []} delay={0} />
        <StatusDonut title="Medicine order status" rows={status.medicine_orders || []} delay={60} />
        <StatusDonut title="Payments" rows={status.payments || []} delay={120} />
        <StatusDonut title="Rider availability" rows={status.riders_by_availability || []} delay={180} />
        <StatusDonut title="Rider accounts" rows={status.riders_by_status || []} delay={240} />
        <StatusDonut title="SMS delivery" rows={status.sms || []} delay={300} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <Panel title="Service distribution" subtitle="Listings per service, highest first" delay={0}>
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {[...serviceTotals].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)).map((service, i) => {
              const value = Number(service.value || 0);
              return (
                <button key={service.slug || service.label} type="button" onClick={() => service.slug && onOpen(service.slug)} className="group rounded-xl p-2 text-left transition hover:bg-[#fef2f2]">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-[#374151] group-hover:text-[#ee0012]">{service.label}</p>
                    <p className="font-bold text-[#111]">{compact(value)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div className="dash-growx h-full rounded-full bg-[#ee0012]" style={{ width: `${Math.max(3, (value / maxService) * 100)}%`, "--d": `${i * 40}ms` }} />
                  </div>
                </button>
              );
            })}
            {!serviceTotals.length && <p className="text-sm text-[#9ca3af]">No data yet.</p>}
          </div>
        </Panel>
        <Panel title="Finance snapshot" subtitle="Delivery fees, earnings and payments" delay={80}>
          <div className="grid gap-2">
            <MiniMetric label="Food delivery fees" value={money(stats?.food_delivery_fees)} note="Delivered food orders" />
            <MiniMetric label="Medicine delivery fees" value={money(stats?.medicine_delivery_fees)} note="Delivered medicine orders" />
            <MiniMetric label="Rider earnings" value={money(stats?.rider_earnings_total)} note="Wallet earning entries" />
            <MiniMetric label="Cash in hand" value={money(stats?.rider_cash_in_hand)} note="Rider collected cash" />
            <MiniMetric label="Successful payments" value={stats?.payments_paid} note={`${money(stats?.payments_total_amount)} total`} slug="payments" onOpen={onOpen} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {groups.map((group, gi) => (
          <Panel key={group.title} title={group.title} delay={gi * 60}>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map(([label, value, slug]) => (
                <MiniMetric key={`${group.title}-${label}`} label={label} value={value} slug={slug} onOpen={onOpen} />
              ))}
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RecentList
          title="Recent app visits"
          items={recent?.visits || []}
          empty="No visit data yet."
          delay={0}
          render={(visit) => (
            <FeedItem key={visit.id} title={visit.user?.name || visit.user?.email || visit.user?.phone || "Guest user"} meta={`${visit.source || "app"} / ${visit.path || "home"} / ${formatDate(visit.visited_at)}`} />
          )}
        />
        <RecentList
          title="Recent food orders"
          items={recent?.food_orders || []}
          empty="No food orders yet."
          delay={60}
          render={(order) => (
            <FeedItem key={order.id} title={order.order_no || `Order #${order.id}`} badge={order.status} meta={`${money(order.grand_total)} / ${order.payment_status} / ${formatDate(order.created_at)}`} />
          )}
        />
        <RecentList
          title="Recent medicine orders"
          items={recent?.medicine_orders || []}
          empty="No medicine orders yet."
          delay={120}
          render={(order) => (
            <FeedItem key={order.id} dark title={order.order_no || `Order #${order.id}`} badge={order.status} meta={`${money(order.grand_total)} / ${order.payment_status} / ${formatDate(order.created_at)}`} />
          )}
        />
        <RecentList
          title="Recent riders and SMS"
          items={[...(recent?.riders || []).map((r) => ({ ...r, rowType: "rider" })), ...(recent?.sms_logs || []).map((s) => ({ ...s, rowType: "sms" }))].slice(0, 6)}
          empty="No rider or SMS activity yet."
          delay={180}
          render={(item) => (
            item.rowType === "rider" ? (
              <FeedItem key={`rider-${item.id}`} title={item.name} meta={`${item.account_status} / ${item.availability_status} / KYC ${item.kyc_status}`} />
            ) : (
              <FeedItem key={`sms-${item.id}`} title={item.phone || "SMS log"} meta={`${item.purpose || "-"} / ${item.status} / HTTP ${item.http_status || "-"}`} />
            )
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
      <style>{DASH_CSS}</style>
      {error && (
        <div className="dash-fade mb-4 rounded-xl border border-[#ee0012]/20 bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">{error}</div>
      )}
      {!soundReady && (
        <div className={`dash-rise mb-4 flex flex-col gap-3 border-l-4 border-l-[#ee0012] p-4 text-sm md:flex-row md:items-center md:justify-between ${CARD}`}>
          <div>
            <p className="font-bold text-[#111]">Live alert sound is waiting for browser permission.</p>
            <p className="mt-1 text-[#6b7280]">Click enable once so new order, delivery and service alerts can play the 5 second tone.</p>
          </div>
          <Button type="button" variant="ghost" onClick={armAlerts}>Enable live alerts</Button>
        </div>
      )}
      {liveAlert && (
        <div className="dash-fade fixed inset-0 z-[100] grid place-items-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="dash-pop w-full max-w-lg overflow-hidden rounded-3xl border border-[#ececec] bg-white shadow-2xl">
            <div className="bg-[#ee0012] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="dash-ring mt-1 h-3 w-3 shrink-0 rounded-full bg-white" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">Live admin alert</p>
                    <h3 className="mt-2 text-2xl font-extrabold">{liveAlert.title}</h3>
                    <p className="mt-1 text-sm text-white/90">{liveAlert.message}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveAlert(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 text-xl font-bold transition hover:bg-white/25"
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
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-left transition hover:border-[#ee0012]/40 hover:bg-[#fef2f2]"
                  >
                    <div>
                      <p className="font-bold text-[#111]">{item.label}</p>
                      <p className="text-xs text-[#6b7280]">{item.type} update detected</p>
                    </div>
                    <span className="rounded-full bg-[#ee0012] px-3 py-1 text-sm font-bold text-white">+{item.delta}</span>
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
              <p className="mt-3 text-xs text-[#9ca3af]">
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
        <DataTable
          label="admin"
          headers={["Name", "Email", "Super", "Actions"]}
          records={coreRecords}
          selectedIds={coreSelectedIds}
          setSelectedIds={setCoreSelectedIds}
          selection={coreSelectionState}
          loading={coreLoading}
          renderCells={(a) => (
            <>
              <td className={`${TD} font-semibold text-[#111]`}>{a.name}</td>
              <td className={TD}>{a.email}</td>
              <td className={TD}>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.is_super ? "bg-[#ee0012] text-white" : "bg-[#f3f4f6] text-[#4b5563]"}`}>{a.is_super ? "Yes" : "No"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => deleteRow("/admin/admins", a.id)}>Delete</Button>
                </div>
              </td>
            </>
          )}
        />
      )}

      {activeModule === "reports" && (
        <DataTable
          label="report"
          headers={["Reporter", "Target", "Reason", "Status", "Actions"]}
          records={coreRecords}
          selectedIds={coreSelectedIds}
          setSelectedIds={setCoreSelectedIds}
          selection={coreSelectionState}
          loading={coreLoading}
          renderCells={(r) => (
            <>
              <td className={TD}>{r.reporter_id}</td>
              <td className={TD}>{r.target_type} #{r.target_id}</td>
              <td className={TD}>{r.reason}</td>
              <td className={TD}>
                <select
                  className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-sm font-medium text-[#111] outline-none transition focus:border-[#ee0012] focus:ring-2 focus:ring-[#ee0012]/15"
                  value={r.status}
                  onChange={(e) => updateReport(r.id, e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="reviewed">reviewed</option>
                  <option value="resolved">resolved</option>
                  <option value="rejected">rejected</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => deleteRow("/admin/reports", r.id)}>Delete</Button>
                </div>
              </td>
            </>
          )}
        />
      )}

      {activeModule === "reviews" && (
        <DataTable
          label="review"
          headers={["User", "Type", "Target", "Rating", "Comment", "Actions"]}
          records={coreRecords}
          selectedIds={coreSelectedIds}
          setSelectedIds={setCoreSelectedIds}
          selection={coreSelectionState}
          loading={coreLoading}
          renderCells={(r) => (
            <>
              <td className={TD}>{r.user_id}</td>
              <td className={TD}>{r.type}</td>
              <td className={TD}>#{r.target_id}</td>
              <td className={TD}>
                <span className="rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-xs font-bold text-[#ee0012]">{r.rating}</span>
              </td>
              <td className={TD}>{r.comment || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => deleteRow("/admin/reviews", r.id)}>Delete</Button>
                </div>
              </td>
            </>
          )}
        />
      )}

      {!ServiceComponent &&
        !["dashboard", "admins", "reports", "reviews"].includes(activeModule) && (
          activeModule?.startsWith("food-") || activeModule?.startsWith("medicine-") ? (
            <FoodAdminPage token={token} resource={activeModule} />
          ) : genericResourceModules.includes(activeModule) ? (
            <ServicePage token={token} resource={activeModule} />
          ) : (
            <div className={`dash-rise ${CARD} p-6 text-sm text-[#6b7280]`}>
              This module will be converted to a full form-based admin screen next.
            </div>
          )
        )}

      {ServiceComponent && <ServiceComponent token={token} onUnauthorized={onLogout} />}
    </DashboardLayout>
  );
}