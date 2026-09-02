import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiRequest } from "../lib/api.js";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../components/BulkDeleteBar.jsx";
import Button from "../components/Button.jsx";
import UsersPage from "./UsersPage.jsx";
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
import SupportSettingsPage from "./services/SupportSettingsPage.jsx";
import MapSettingsPage from "./services/MapSettingsPage.jsx";
import AppVersionSettingsPage from "./services/AppVersionSettingsPage.jsx";
import DeliveryIncomePage from "./services/DeliveryIncomePage.jsx";

const DEFAULT_ADMIN_MODULES = [
  { name: "Dashboard", slug: "dashboard", group_name: "Core", route: "/admin" },
  { name: "Profile", slug: "profile", group_name: "Core", route: "/admin/profile" },
  { name: "Users", slug: "users", group_name: "Core", route: "/admin/users" },
  { name: "Home Banners", slug: "home-banners", group_name: "Engagement", route: "/admin/home-banners" },
  { name: "Home Services", slug: "home-service-shortcuts", group_name: "Engagement", route: "/admin/home-service-shortcuts" },
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
  { name: "Admin Income", slug: "delivery-income", group_name: "Finance", route: "/admin/delivery-income" },
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
  const merged = new Map(DEFAULT_ADMIN_MODULES.map((item) => [item.slug, item]));
  apiModules.forEach((item) => {
    if (item?.slug && !hidden.has(item.slug)) {
      merged.set(item.slug, { ...merged.get(item.slug), ...item });
    }
  });
  return Array.from(merged.values()).filter((item) => !hidden.has(item.slug));
}

export default function DashboardPage({ token, onLogout }) {
  const [admin, setAdmin] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [coreRecords, setCoreRecords] = useState([]);
  const [coreMeta, setCoreMeta] = useState(null);
  const [coreLoading, setCoreLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardRecent, setDashboardRecent] = useState(null);
  const [coreSelectedIds, setCoreSelectedIds] = useState([]);
  const [coreBulkDeleting, setCoreBulkDeleting] = useState(false);

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
    if (activeModule === "admins") return "Admins";
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
    "delivery-income": DeliveryIncomePage,
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
        <div className="space-y-5">
          {(() => {
            const formatDate = (value) => {
              if (!value) return "-";
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return value;
              return date.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
            };
            const compact = (value) => Number(value || 0).toLocaleString();
            const money = (value) => `BDT ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            const charts = dashboardStats?.charts || {};
            const dailyVisits = charts.daily_visits || [];
            const monthlyVisits = charts.monthly_visits || [];
            const serviceTotals = charts.service_totals || [];
            const maxDaily = Math.max(1, ...dailyVisits.map((item) => Number(item.visits || 0)));
            const maxMonthly = Math.max(1, ...monthlyVisits.map((item) => Number(item.visits || 0)));
            const maxService = Math.max(1, ...serviceTotals.map((item) => Number(item.value || 0)));

            const kpis = [
              { label: "Visits Today", value: dashboardStats?.visits_today, note: `${compact(dashboardStats?.unique_visitors_today)} unique users`, accent: "red", slug: "users" },
              { label: "Weekly Visits", value: dashboardStats?.visits_week, note: "Last 7 days activity", accent: "dark" },
              { label: "Monthly Visits", value: dashboardStats?.visits_month, note: "Current month traffic", accent: "dark" },
              { label: "New Users", value: dashboardStats?.new_users_month, note: `${compact(dashboardStats?.new_users_today)} joined today`, accent: "red", slug: "users" },
              { label: "Food Orders", value: dashboardStats?.food_orders, note: `${compact(dashboardStats?.food_orders_pending)} needs action`, accent: "red", slug: "food-orders" },
              { label: "Messages", value: dashboardStats?.messages_total, note: `${compact(dashboardStats?.messages_today)} sent today`, accent: "dark", slug: "messages" },
              { label: "Reports", value: dashboardStats?.reports_pending, note: "Pending moderation", accent: "red", slug: "reports" },
              { label: "Reviews", value: dashboardStats?.reviews_total, note: "Community feedback", accent: "dark", slug: "reviews" },
            ];

            const contentSignals = [
              { label: "Active Banners", value: dashboardStats?.home_banners_active, total: dashboardStats?.home_banners, slug: "home-banners" },
              { label: "Updates", value: dashboardStats?.updates, total: dashboardStats?.updates, slug: "updates" },
              { label: "News", value: dashboardStats?.news, total: dashboardStats?.news, slug: "news" },
              { label: "Notices", value: dashboardStats?.notices, total: dashboardStats?.notices, slug: "notices" },
              { label: "Notifications", value: dashboardStats?.notifications_total, total: dashboardStats?.notifications_total, slug: "notifications" },
              { label: "Emergency Contacts", value: dashboardStats?.emergency_contacts, total: dashboardStats?.emergency_contacts, slug: "emergency" },
            ];

            const serviceHighlights = [
              { label: "Workers", value: dashboardStats?.workers, slug: "workers" },
              { label: "Businesses", value: dashboardStats?.businesses, slug: "businesses" },
              { label: "Marketplace", value: dashboardStats?.marketplace_items, slug: "marketplace" },
              { label: "Jobs", value: dashboardStats?.jobs, slug: "jobs" },
              { label: "Doctors", value: dashboardStats?.doctors, slug: "doctors" },
              { label: "Hospitals", value: dashboardStats?.hospitals, slug: "hospitals" },
              { label: "Restaurants", value: dashboardStats?.restaurants, slug: "restaurants" },
              { label: "Food Items", value: dashboardStats?.food_items, slug: "food-items" },
              { label: "Properties", value: dashboardStats?.properties, slug: "property" },
              { label: "Education", value: dashboardStats?.education, slug: "education" },
              { label: "Launch Routes", value: dashboardStats?.launches, slug: "launches" },
              { label: "Car Rentals", value: dashboardStats?.car_rentals, slug: "car-rental" },
            ];

            return (
              <>
                {/* <section className="rounded-[18px] border border-[#020617] bg-[#030716] p-5 text-white shadow-lg shadow-slate-900/10 md:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-red-300">Admin Command Center</p>
                      <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Bholabashi operations dashboard</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                        Track traffic, user growth, service coverage, food orders, notifications and moderation from one focused workspace.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="dark" onClick={() => setActiveModule("users")}>Users</Button>
                      <Button variant="dark" onClick={() => setActiveModule("food-orders")}>Food orders</Button>
                      <Button variant="dark" onClick={() => setActiveModule("notifications")}>Send notification</Button>
                    </div>
                  </div>
                </section> */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => item.slug && setActiveModule(item.slug)}
                      className={`group rounded-[16px] border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${item.accent === "red" ? "border-red-100 hover:border-red-300" : "border-[#dfe6ef] hover:border-slate-300"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">{item.label}</p>
                          <p className="mt-4 text-3xl font-bold text-[#050b18]">{compact(item.value)}</p>
                          <p className="mt-1 text-xs text-[#64748b]">{item.note}</p>
                        </div>
                        <span className={`flex h-10 w-10 items-center justify-center rounded-[12px] text-lg font-black ${item.accent === "red" ? "bg-red-50 text-[#ee0012]" : "bg-slate-100 text-[#0f172a]"}`}>
                          {item.label.slice(0, 1)}
                        </span>
                      </div>
                    </button>
                  ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md md:p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#101827]">Daily visitor trend</h3>
                        <p className="text-sm text-[#64748b]">Last 14 days app visit, new user, message and order activity.</p>
                      </div>
                      <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Live from DB</span>
                    </div>
                    <div className="mt-6 flex h-72 items-end gap-2 overflow-x-auto rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-4">
                      {dailyVisits.length ? dailyVisits.map((item) => {
                        const height = Math.max(8, (Number(item.visits || 0) / maxDaily) * 210);
                        return (
                          <div key={item.date || item.label} className="flex min-w-[44px] flex-1 flex-col items-center justify-end gap-2">
                            <div className="text-[11px] font-semibold text-[#64748b]">{compact(item.visits)}</div>
                            <div className="group relative flex h-[220px] w-full items-end justify-center">
                              <div
                                className="w-7 rounded-t-[8px] bg-[#ee0012] transition duration-200 group-hover:w-9 group-hover:bg-[#c90010]"
                                style={{ height }}
                              />
                              <div className="pointer-events-none absolute bottom-full mb-2 hidden w-40 rounded-[12px] border border-[#dfe6ef] bg-white p-3 text-left text-xs shadow-xl group-hover:block">
                                <p className="font-bold text-[#101827]">{item.label}</p>
                                <p className="text-[#64748b]">Visits: {compact(item.visits)}</p>
                                <p className="text-[#64748b]">New users: {compact(item.users)}</p>
                                <p className="text-[#64748b]">Messages: {compact(item.messages)}</p>
                                <p className="text-[#64748b]">Food orders: {compact(item.orders)}</p>
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-[10px] text-[#8b98ab]">{item.label}</div>
                          </div>
                        );
                      }) : (
                        <div className="m-auto rounded-[14px] border border-dashed border-[#cbd5e1] bg-white px-6 py-5 text-center text-sm text-[#64748b]">
                          Visit data will appear after users open the app.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md">
                      <h3 className="text-lg font-bold text-[#101827]">Visitor summary</h3>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Today</p>
                          <p className="mt-2 text-2xl font-bold text-[#050b18]">{compact(dashboardStats?.visits_today)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[14px] border border-[#edf1f6] bg-white p-4">
                            <p className="text-xs text-[#64748b]">Weekly</p>
                            <p className="mt-2 text-xl font-bold text-[#050b18]">{compact(dashboardStats?.visits_week)}</p>
                          </div>
                          <div className="rounded-[14px] border border-[#edf1f6] bg-white p-4">
                            <p className="text-xs text-[#64748b]">Monthly</p>
                            <p className="mt-2 text-xl font-bold text-[#050b18]">{compact(dashboardStats?.visits_month)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md">
                      <h3 className="text-lg font-bold text-[#101827]">Monthly growth</h3>
                      <div className="mt-4 space-y-3">
                        {monthlyVisits.map((item) => (
                          <div key={item.label}>
                            <div className="mb-1 flex justify-between text-xs text-[#64748b]">
                              <span>{item.label}</span>
                              <span>{compact(item.visits)} visits</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#eef2f7]">
                              <div className="h-2 rounded-full bg-[#ee0012]" style={{ width: `${Math.max(4, (Number(item.visits || 0) / maxMonthly) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                        {!monthlyVisits.length && <p className="text-sm text-[#64748b]">No monthly data yet.</p>}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md md:p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#101827]">Service distribution</h3>
                        <p className="text-sm text-[#64748b]">Total records by service, clickable for fast management.</p>
                      </div>
                      <Button variant="ghost" onClick={() => setActiveModule("reports")}>Moderation queue</Button>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {(serviceTotals.length ? serviceTotals : serviceHighlights).map((service) => {
                        const value = Number(service.value || 0);
                        const width = Math.max(3, (value / maxService) * 100);
                        return (
                          <button
                            key={service.slug || service.label}
                            type="button"
                            onClick={() => service.slug && setActiveModule(service.slug)}
                            className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-[#101827]">{service.label}</p>
                              <p className="text-sm font-black text-[#050b18]">{compact(value)}</p>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white">
                              <div className="h-2 rounded-full bg-[#ee0012]" style={{ width: `${width}%` }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md md:p-6">
                    <h3 className="text-lg font-bold text-[#101827]">Content and engagement</h3>
                    <p className="text-sm text-[#64748b]">Publishing, notification and support signals.</p>
                    <div className="mt-5 space-y-3">
                      {contentSignals.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => item.slug && setActiveModule(item.slug)}
                          className="flex w-full items-center justify-between rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] px-4 py-3 text-left transition hover:border-red-200 hover:bg-white hover:shadow-sm"
                        >
                          <span className="text-sm font-semibold text-[#24324a]">{item.label}</span>
                          <span className="text-sm font-black text-[#050b18]">{compact(item.value)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-4">
                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md xl:col-span-2">
                    <p className="text-sm font-bold text-[#101827]">Recent app visits</p>
                    <ul className="mt-3 space-y-3 text-sm text-[#53637a]">
                      {(dashboardRecent?.visits || []).map((visit) => (
                        <li key={visit.id} className="flex items-start justify-between gap-3 rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
                          <div>
                            <p className="font-semibold text-[#24324a]">{visit.user?.name || visit.user?.email || visit.user?.phone || "Guest user"}</p>
                            <p className="text-xs text-[#8b98ab]">{visit.source || "app"} / {visit.path || "home"}</p>
                          </div>
                          <span className="whitespace-nowrap text-xs text-[#8b98ab]">{formatDate(visit.visited_at)}</span>
                        </li>
                      ))}
                      {!dashboardRecent?.visits?.length && <li className="text-[#8b98ab]">No visit data yet.</li>}
                    </ul>
                  </div>

                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md">
                    <p className="text-sm font-bold text-[#101827]">Recent food orders</p>
                    <ul className="mt-3 space-y-3 text-sm text-[#53637a]">
                      {(dashboardRecent?.food_orders || []).map((order) => (
                        <li key={order.id} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
                          <div className="flex justify-between gap-2">
                            <p className="font-semibold text-[#24324a]">{order.order_no || `Order #${order.id}`}</p>
                            <p className="text-xs font-bold text-[#ee0012]">{order.status}</p>
                          </div>
                          <p className="mt-1 text-xs text-[#8b98ab]">{money(order.grand_total)} - {formatDate(order.created_at)}</p>
                        </li>
                      ))}
                      {!dashboardRecent?.food_orders?.length && <li className="text-[#8b98ab]">No orders yet.</li>}
                    </ul>
                  </div>

                  <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:shadow-md">
                    <p className="text-sm font-bold text-[#101827]">Moderation feed</p>
                    <ul className="mt-3 space-y-3 text-sm text-[#53637a]">
                      {(dashboardRecent?.reports || []).slice(0, 3).map((report) => (
                        <li key={report.id} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
                          <p className="font-semibold text-[#24324a]">{report.target_type} #{report.target_id}</p>
                          <p className="mt-1 text-xs text-[#8b98ab]">{report.reason || "No reason"}</p>
                        </li>
                      ))}
                      {(dashboardRecent?.reviews || []).slice(0, 2).map((review) => (
                        <li key={`review-${review.id}`} className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] px-3 py-2">
                          <p className="font-semibold text-[#24324a]">{review.type} #{review.target_id}</p>
                          <p className="mt-1 text-xs text-[#8b98ab]">Rating {review.rating} {"\u2605"}</p>
                        </li>
                      ))}
                      {!dashboardRecent?.reports?.length && !dashboardRecent?.reviews?.length && <li className="text-[#8b98ab]">No moderation items.</li>}
                    </ul>
                  </div>
                </section>
              </>
            );
          })()}
        </div>
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
