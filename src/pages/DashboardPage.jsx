import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiRequest } from "../lib/api.js";
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
import NotificationsPage from "./services/NotificationsPage.jsx";
import MessagesPage from "./services/MessagesPage.jsx";
import PaymentsPage from "./services/PaymentsPage.jsx";
import SmsSettingsPage from "./services/SmsSettingsPage.jsx";
import EmailSettingsPage from "./services/EmailSettingsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";

const DEFAULT_ADMIN_MODULES = [
  { name: "Dashboard", slug: "dashboard", group_name: "Core", route: "/admin" },
  { name: "Profile", slug: "profile", group_name: "Core", route: "/admin/profile" },
  { name: "Users", slug: "users", group_name: "Core", route: "/admin/users" },
  { name: "Workers", slug: "workers", group_name: "Services", route: "/admin/workers" },
  { name: "Businesses", slug: "businesses", group_name: "Services", route: "/admin/businesses" },
  { name: "Marketplace", slug: "marketplace", group_name: "Services", route: "/admin/marketplace" },
  { name: "Jobs", slug: "jobs", group_name: "Services", route: "/admin/jobs" },
  { name: "Doctors", slug: "doctors", group_name: "Services", route: "/admin/doctors" },
  { name: "Hospitals", slug: "hospitals", group_name: "Services", route: "/admin/hospitals" },
  { name: "Hotels", slug: "hotels", group_name: "Services", route: "/admin/hotels" },
  { name: "Restaurants", slug: "restaurants", group_name: "Services", route: "/admin/restaurants" },
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
];

function mergeAdminModules(apiModules = []) {
  const merged = new Map(DEFAULT_ADMIN_MODULES.map((item) => [item.slug, item]));
  apiModules.forEach((item) => {
    if (item?.slug) {
      merged.set(item.slug, { ...merged.get(item.slug), ...item });
    }
  });
  return Array.from(merged.values());
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
        setDashboardStats(data.stats || null);
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
        } else if (activeModule === "reports") {
          const data = await apiRequest("/admin/reports", { token });
          setCoreRecords(data.data || []);
          setCoreMeta(data);
        } else if (activeModule === "reviews") {
          const data = await apiRequest("/admin/reviews", { token });
          setCoreRecords(data.data || []);
          setCoreMeta(data);
        } else {
          setCoreRecords([]);
          setCoreMeta(null);
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
    notifications: NotificationsPage,
    messages: MessagesPage,
    payments: PaymentsPage,
    "sms-settings": SmsSettingsPage,
    "email-settings": EmailSettingsPage,
  };
  const ServiceComponent = servicePageMap[activeModule] || null;

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
      {activeModule === "dashboard" && (
        <div className="space-y-6">
          {(() => {
            const formatDate = (value) => {
              if (!value) return "-";
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return value;
              return date.toLocaleString();
            };

            const services = [
              { slug: "users", label: "Users", stat: dashboardStats?.users, note: "Registered accounts" },
              { slug: "workers", label: "Workers", stat: dashboardStats?.workers, note: "Verified workers" },
              { slug: "businesses", label: "Businesses", stat: dashboardStats?.businesses, note: "Local listings" },
              { slug: "marketplace", label: "Marketplace", stat: dashboardStats?.marketplace_items, note: "Active items" },
              { slug: "jobs", label: "Jobs", stat: dashboardStats?.jobs, note: "Open posts" },
              { slug: "doctors", label: "Doctors", stat: dashboardStats?.doctors, note: "Doctor profiles" },
              { slug: "hospitals", label: "Hospitals", stat: dashboardStats?.hospitals, note: "Hospital records" },
              { slug: "hotels", label: "Hotels", stat: dashboardStats?.hotels, note: "Hotel listings" },
              { slug: "restaurants", label: "Restaurants", stat: dashboardStats?.restaurants, note: "Restaurant listings" },
              { slug: "property", label: "Property", stat: dashboardStats?.properties, note: "Rent & sale" },
              { slug: "education", label: "Education", stat: dashboardStats?.education, note: "Institutes" },
              { slug: "launches", label: "Launch Services", stat: dashboardStats?.launches, note: "Routes & schedules" },
            ];

            return (
              <>
                <div className="rounded-md border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Operations dashboard</p>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {admin?.name || "Admin"} · Bholabashi Control
                      </h2>
                      <p className="text-sm text-slate-500">{admin?.email || ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        Status: Active
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        API: {dashboardStats ? "Connected" : "Loading"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        Last login: {formatDate(admin?.last_login_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Users</p>
                    <p className="text-2xl font-semibold text-slate-900">{dashboardStats?.users ?? "-"}</p>
                    <p className="text-xs text-slate-400">Registered accounts</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Marketplace</p>
                    <p className="text-2xl font-semibold text-slate-900">{dashboardStats?.marketplace_items ?? "-"}</p>
                    <p className="text-xs text-slate-400">Active items</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Jobs</p>
                    <p className="text-2xl font-semibold text-slate-900">{dashboardStats?.jobs ?? "-"}</p>
                    <p className="text-xs text-slate-400">Open positions</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Health</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {(dashboardStats?.doctors ?? 0) + (dashboardStats?.hospitals ?? 0) || "-"}
                    </p>
                    <p className="text-xs text-slate-400">Doctors + Hospitals</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Reports</p>
                    <p className="text-2xl font-semibold text-slate-900">{dashboardStats?.reports_pending ?? "-"}</p>
                    <p className="text-xs text-slate-400">Pending moderation</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Reviews</p>
                    <p className="text-2xl font-semibold text-slate-900">{dashboardStats?.reviews_total ?? "-"}</p>
                    <p className="text-xs text-slate-400">Total feedback</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                  <div className="rounded-md border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Service coverage</h3>
                        <p className="text-sm text-slate-500">
                          Live service totals and quick access to each module.
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => setActiveModule("reports")}>
                        Review reports
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {services.map((service) => (
                        <button
                          key={service.slug}
                          onClick={() => setActiveModule(service.slug)}
                          className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-white"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{service.label}</p>
                            <p className="text-xs text-slate-500">{service.note}</p>
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {service.stat ?? "-"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
                    <p className="text-sm text-slate-500">
                      Jump directly to the most common admin tasks.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button onClick={() => setActiveModule("users")}>Manage users</Button>
                      <Button variant="ghost" onClick={() => setActiveModule("marketplace")}>
                        Review marketplace
                      </Button>
                      <Button variant="ghost" onClick={() => setActiveModule("jobs")}>
                        Review job posts
                      </Button>
                      <Button variant="ghost" onClick={() => setActiveModule("updates")}>
                        Post updates
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent users</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                      {(dashboardRecent?.users || []).map((u) => (
                        <li key={u.id} className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">{u.name || "Unnamed"}</p>
                            <p className="text-xs text-slate-400">{u.email || u.phone || "-"}</p>
                          </div>
                          <span className="text-xs text-slate-400">{formatDate(u.created_at)}</span>
                        </li>
                      ))}
                      {!dashboardRecent?.users?.length && <li className="text-slate-400">No data</li>}
                    </ul>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent reports</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                      {(dashboardRecent?.reports || []).map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">
                              {r.target_type} #{r.target_id}
                            </p>
                            <p className="text-xs text-slate-400">{r.reason || "-"}</p>
                          </div>
                          <span className="text-xs text-slate-400">{r.status}</span>
                        </li>
                      ))}
                      {!dashboardRecent?.reports?.length && <li className="text-slate-400">No data</li>}
                    </ul>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent reviews</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                      {(dashboardRecent?.reviews || []).map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">
                              {r.type} #{r.target_id}
                            </p>
                            <p className="text-xs text-slate-400">{r.comment || "No comment"}</p>
                          </div>
                          <span className="text-xs text-slate-400">{r.rating}★</span>
                        </li>
                      ))}
                      {!dashboardRecent?.reviews?.length && <li className="text-slate-400">No data</li>}
                    </ul>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
      {activeModule === "admins" && (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-[640px] w-full text-xs md:text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 md:px-4">Name</th>
                <th className="text-left px-3 py-2 md:px-4">Email</th>
                <th className="text-left px-3 py-2 md:px-4">Super</th>
                <th className="text-right px-3 py-2 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coreRecords.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
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
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    {coreLoading ? "Loading..." : "No admins found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeModule === "reports" && (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 md:px-4">Reporter</th>
                <th className="text-left px-3 py-2 md:px-4">Target</th>
                <th className="text-left px-3 py-2 md:px-4">Reason</th>
                <th className="text-left px-3 py-2 md:px-4">Status</th>
                <th className="text-right px-3 py-2 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coreRecords.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 md:px-4">{r.reporter_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.target_type} #{r.target_id}</td>
                  <td className="px-3 py-2 md:px-4">{r.reason}</td>
                  <td className="px-3 py-2 md:px-4">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
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
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    {coreLoading ? "Loading..." : "No reports found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeModule === "reviews" && (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
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
                <tr key={r.id} className="border-t border-slate-100">
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
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
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
          <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
            This module will be converted to a full form-based admin screen next.
          </div>
        )}

      {ServiceComponent && <ServiceComponent token={token} onUnauthorized={onLogout} />}
    </DashboardLayout>
  );
}



