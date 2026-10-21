import { useEffect, useMemo, useState } from "react";
import { apiRequest, apiUpload } from "../../lib/api.js";
import Button from "../../components/Button.jsx";
import ImageUploadPreview from "../../components/ImageUploadPreview.jsx";
import { formatDateTime } from "../../lib/formatters.js";
import Pagination from "../../components/Pagination.jsx";

const AUTOMATION_CAMPAIGNS = {
  new_user: ["New user welcome", "Registered but has not ordered yet"],
  cart_abandoned: ["Cart recovery", "Food left in cart for 30-360 minutes"],
  checkout_abandoned: ["Checkout recovery", "Reached checkout but did not order"],
  rejected_recovery: ["Rejected order recovery", "Suggests an available alternative"],
  reorder: ["Smart reorder", "Previous delivered item is available again"],
  inactive_user: ["Inactive user", "No app activity for at least 15 days"],
  personalized: ["Personalized suggestion", "Recommendation based on order history"],
  free_delivery: ["Free delivery campaign", "Bhola municipality free delivery; outside municipality gets Tk 40 off delivery charge"],
  discovery: ["Food discovery fallback", "Keeps the 10-minute schedule active when no higher-priority campaign is eligible"],
};

export default function NotificationsPage({ token, onUnauthorized }) {
  const [target, setTarget] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [automation, setAutomation] = useState(null);
  const [automationStats, setAutomationStats] = useState(null);
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [decisionMeta, setDecisionMeta] = useState(null);
  const [decisionPage, setDecisionPage] = useState(1);
  const [decisionPerPage, setDecisionPerPage] = useState(20);
  const [decisionCampaign, setDecisionCampaign] = useState("");
  const [decisionStatus, setDecisionStatus] = useState("");
  const [decisionSearch, setDecisionSearch] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);

  const canSend = useMemo(() => {
    if (target === "user" && !selectedUser) return false;
    return Boolean(title.trim() || message.trim() || imageFile);
  }, [target, selectedUser, title, message, imageFile]);

  const loadNotifications = async () => {
    setLoadingList(true);
    setError("");
    try {
      const data = await apiRequest("/admin/notifications?per_page=10", { token });
      setNotifications(data?.data || []);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
      if (err.message?.toLowerCase().includes("forbidden")) {
        onUnauthorized?.();
      }
    } finally {
      setLoadingList(false);
    }
  };

  const loadAutomation = async () => {
    setLoadingDecisions(true);
    try {
      const params = new URLSearchParams({
        page: String(decisionPage),
        per_page: String(decisionPerPage),
      });
      if (decisionCampaign) params.set("campaign", decisionCampaign);
      if (decisionStatus) params.set("status", decisionStatus);
      if (decisionSearch.trim()) params.set("search", decisionSearch.trim());
      const data = await apiRequest(`/admin/notifications/automation?${params.toString()}`, { token });
      setAutomation(data?.settings || null);
      setAutomationStats(data?.stats || null);
      setRecentDecisions(data?.decisions?.data || []);
      setDecisionMeta(data?.decisions || null);
    } catch (err) {
      setError(err.message || "Unable to load AI notification automation.");
      if (err.message?.toLowerCase().includes("forbidden")) onUnauthorized?.();
    } finally {
      setLoadingDecisions(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadAutomation, decisionSearch.trim() ? 350 : 0);
    return () => clearTimeout(timer);
  }, [decisionPage, decisionPerPage, decisionCampaign, decisionStatus, decisionSearch]);

  const setAutomationField = (field, value) => {
    setAutomation((current) => ({ ...current, [field]: value }));
  };

  const saveAutomation = async () => {
    if (!automation) return;
    setSavingAutomation(true);
    setError("");
    try {
      const body = {
        is_enabled: Boolean(automation.is_enabled),
        use_ai_copy: Boolean(automation.use_ai_copy),
        timezone: automation.timezone || "Asia/Dhaka",
        quiet_hours_start: String(automation.quiet_hours_start || "21:00").slice(0, 5),
        quiet_hours_end: String(automation.quiet_hours_end || "10:45").slice(0, 5),
        max_promotional_per_day: Number(automation.max_promotional_per_day || 1),
        max_promotional_per_week: Number(automation.max_promotional_per_week || 4),
        minimum_gap_hours: Number(automation.minimum_gap_hours || 20),
        batch_limit: Number(automation.batch_limit || 50),
        campaigns: Object.fromEntries(
          Object.keys(AUTOMATION_CAMPAIGNS).map((key) => [key, automation.campaigns?.[key] !== false]),
        ),
      };
      const data = await apiRequest("/admin/notifications/automation", { method: "PUT", token, body });
      setAutomation(data?.settings || automation);
      await loadAutomation();
    } catch (err) {
      setError(err.message || "Unable to save AI notification automation.");
    } finally {
      setSavingAutomation(false);
    }
  };

  const runAutomation = async () => {
    setRunningAutomation(true);
    setError("");
    try {
      await apiRequest("/admin/notifications/automation/run", { method: "POST", token });
      await loadAutomation();
    } catch (err) {
      setError(err.message || "Unable to run AI notification automation.");
    } finally {
      setRunningAutomation(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      if (target !== "user" || userSearch.trim().length < 2) {
        setUserResults([]);
        return;
      }
      try {
        const data = await apiRequest(`/admin/users?search=${encodeURIComponent(userSearch.trim())}`, { token });
        setUserResults(data?.data || []);
      } catch (err) {
        if (err.message?.toLowerCase().includes("forbidden")) {
          onUnauthorized?.();
        }
      }
    };

    const timer = setTimeout(loadUsers, 350);
    return () => clearTimeout(timer);
  }, [userSearch, target]);

  const sendNotification = async () => {
    if (!canSend) return;
    setSending(true);
    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("target", target);
      if (target === "user" && selectedUser) {
        formData.append("user_id", String(selectedUser.id));
      }
      if (title.trim()) formData.append("title", title.trim());
      if (message.trim()) formData.append("message", message.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await apiUpload("/admin/notifications/send", { token, formData });
      setStatus(res?.message || "Notification sent.");
      setTitle("");
      setMessage("");
      setImageFile(null);
      if (target === "user") {
        setUserSearch("");
        setSelectedUser(null);
        setUserResults([]);
      }
      loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {automation && (
        <section className="border border-[#dfe6ef] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e8edf4] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[#101827]">AI notification automation</h2>
                <span className={`text-xs font-semibold ${automation.is_enabled ? "text-emerald-700" : "text-[#64748b]"}`}>
                  {automation.is_enabled ? "Running" : "Paused"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#64748b]">
                The system selects eligible users, send time, verified content and destination automatically.
              </p>
              <p className="mt-1 text-xs text-[#8a96a8]">
                Last run: {automation.last_run_at ? formatDateTime(automation.last_run_at) : "Not run yet"}
                {automation.last_run_summary ? ` · ${automation.last_run_summary}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#334155]">
                <input
                  type="checkbox"
                  checked={Boolean(automation.is_enabled)}
                  onChange={(event) => setAutomationField("is_enabled", event.target.checked)}
                  className="h-4 w-4 accent-red-700"
                />
                Automation enabled
              </label>
              <Button onClick={runAutomation} disabled={runningAutomation || !automation.is_enabled}>
                {runningAutomation ? "Evaluating..." : "Run now"}
              </Button>
            </div>
          </div>

          <div className="grid gap-px bg-[#e8edf4] lg:grid-cols-4">
            {[
              ["Sent", automationStats?.sent],
              ["Opened", automationStats?.opened],
              ["Orders", automationStats?.converted],
              ["Failed", automationStats?.failed],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-4">
                <div className="text-xs font-semibold uppercase text-[#7a8799]">{label} · 7 days</div>
                <div className="mt-1 text-2xl font-semibold text-[#101827]">{Number(value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 px-5 py-5 xl:grid-cols-[1.2fr,0.8fr]">
            <div>
              <h3 className="text-sm font-semibold text-[#101827]">Automatic campaigns</h3>
              <div className="mt-3 divide-y divide-[#edf1f6] border-y border-[#edf1f6]">
                {Object.entries(AUTOMATION_CAMPAIGNS).map(([key, [label, description]]) => (
                  <label key={key} className="flex cursor-pointer items-start justify-between gap-4 py-3">
                    <span>
                      <span className="block text-sm font-semibold text-[#27364a]">{label}</span>
                      <span className="mt-0.5 block text-xs text-[#7a8799]">{description}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={automation.campaigns?.[key] !== false}
                      onChange={(event) => setAutomationField("campaigns", { ...automation.campaigns, [key]: event.target.checked })}
                      className="mt-1 h-4 w-4 shrink-0 accent-red-700"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#101827]">Delivery controls</h3>
              <label className="mt-3 flex items-center gap-2 border-y border-[#edf1f6] py-3 text-sm font-semibold text-[#334155]">
                <input
                  type="checkbox"
                  checked={Boolean(automation.use_ai_copy)}
                  onChange={(event) => setAutomationField("use_ai_copy", event.target.checked)}
                  className="h-4 w-4 accent-red-700"
                />
                Generate personalized Bangla copy with AI
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[#64748b]">
                  Quiet from
                  <input type="time" value={String(automation.quiet_hours_start || "21:00").slice(0, 5)} onChange={(e) => setAutomationField("quiet_hours_start", e.target.value)} className="mt-1 w-full border border-[#dfe6ef] px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-semibold text-[#64748b]">
                  Quiet until
                  <input type="time" value={String(automation.quiet_hours_end || "10:45").slice(0, 5)} onChange={(e) => setAutomationField("quiet_hours_end", e.target.value)} className="mt-1 w-full border border-[#dfe6ef] px-3 py-2 text-sm" />
                </label>
                {[
                  ["Daily limit", "max_promotional_per_day", 1, 3],
                  ["Weekly limit", "max_promotional_per_week", 1, 7],
                  ["Minimum gap (hours)", "minimum_gap_hours", 6, 168],
                  ["Maximum per run", "batch_limit", 1, 200],
                ].map(([label, field, min, max]) => (
                  <label key={field} className="text-xs font-semibold text-[#64748b]">
                    {label}
                    <input type="number" min={min} max={max} value={automation[field] ?? min} onChange={(e) => setAutomationField(field, Number(e.target.value))} className="mt-1 w-full border border-[#dfe6ef] px-3 py-2 text-sm" />
                  </label>
                ))}
              </div>
              <Button className="mt-4 w-full" onClick={saveAutomation} disabled={savingAutomation}>
                {savingAutomation ? "Saving..." : "Save automation settings"}
              </Button>
            </div>
          </div>

          <div className="border-t border-[#e8edf4] px-5 py-5">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#101827]">All AI decisions</h3>
                <p className="mt-1 text-xs text-[#7a8799]">Every queued, sent, opened, converted, suppressed and failed decision is retained.</p>
              </div>
              <button type="button" onClick={loadAutomation} className="text-xs font-semibold text-red-700">
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr),220px,180px]">
              <input
                value={decisionSearch}
                onChange={(event) => { setDecisionSearch(event.target.value); setDecisionPage(1); }}
                placeholder="Search user, phone, title or message"
                className="border border-[#dfe6ef] px-3 py-2 text-sm"
              />
              <select
                value={decisionCampaign}
                onChange={(event) => { setDecisionCampaign(event.target.value); setDecisionPage(1); }}
                className="border border-[#dfe6ef] px-3 py-2 text-sm"
              >
                <option value="">All campaigns</option>
                {Object.entries(AUTOMATION_CAMPAIGNS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select
                value={decisionStatus}
                onChange={(event) => { setDecisionStatus(event.target.value); setDecisionPage(1); }}
                className="border border-[#dfe6ef] px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
                <option value="converted">Ordered</option>
                <option value="suppressed">Suppressed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="mt-4 overflow-x-auto border-y border-[#e8edf4]">
              <table className="min-w-[1180px] w-full text-xs">
                <thead className="bg-[#f8fafc] text-[#53637a]">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Campaign</th>
                    <th className="px-3 py-2 text-left">Title and message</th>
                    <th className="px-3 py-2 text-left">Score</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Sent</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDecisions.map((decision) => (
                    <tr key={decision.id} className="border-t border-[#edf1f6] align-top hover:bg-[#fbfcfe]">
                      <td className="px-3 py-3 font-semibold text-[#526176]">#{decision.id}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#26364a]">{decision.user?.name || `User #${decision.user_id}`}</div>
                        <div className="mt-0.5 text-[#7a8799]">{decision.user?.phone || decision.user?.email || "No contact"}</div>
                      </td>
                      <td className="px-3 py-3">{AUTOMATION_CAMPAIGNS[decision.campaign]?.[0] || decision.campaign}</td>
                      <td className="max-w-[360px] px-3 py-3">
                        <div className="font-semibold text-[#26364a]">{decision.title || "Pending generation"}</div>
                        <div className="mt-1 line-clamp-2 text-[#64748b]">{decision.message || "Message has not been generated yet."}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold">{Number(decision.score || 0).toFixed(0)}</td>
                      <td className="px-3 py-3 capitalize">{decision.copy_source || "-"}</td>
                      <td className="px-3 py-3 font-semibold capitalize">
                        <span className={decision.converted_at ? "text-emerald-700" : decision.opened_at ? "text-blue-700" : decision.status === "failed" ? "text-red-700" : "text-[#44546a]"}>
                          {decision.converted_at ? "ordered" : decision.opened_at ? "opened" : decision.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">{decision.sent_at ? formatDateTime(decision.sent_at) : "-"}</td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => setSelectedDecision(decision)} className="font-semibold text-red-700 hover:text-red-900">View details</button>
                      </td>
                    </tr>
                  ))}
                  {!recentDecisions.length && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-[#7a8799]">{loadingDecisions ? "Loading decisions..." : "No AI decisions match these filters."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Pagination
                meta={decisionMeta}
                page={decisionPage}
                perPage={decisionPerPage}
                onPageChange={setDecisionPage}
                onPerPageChange={(value) => { setDecisionPerPage(value); setDecisionPage(1); }}
              />
            </div>
          </div>
        </section>
      )}

      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#101827]">Send notification</h2>
            <p className="text-sm text-[#64748b]">
              Title, message, or image can be sent. Image-only notifications are supported.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr,1fr]">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#64748b]">Target</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTarget("all")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  target === "all" ? "border-red-700 bg-red-700 text-white" : "border-[#dfe6ef] text-[#53637a]"
                }`}
              >
                All users
              </button>
              <button
                type="button"
                onClick={() => setTarget("user")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  target === "user" ? "border-red-700 bg-red-700 text-white" : "border-[#dfe6ef] text-[#53637a]"
                }`}
              >
                Single user
              </button>
            </div>

            {target === "user" && (
              <div className="space-y-2">
                <input
                  className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  placeholder="Search user by name, phone, email"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {selectedUser && (
                  <div className="rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-xs">
                    Selected: {selectedUser.name || "Unnamed"} ({selectedUser.email || selectedUser.phone || "N/A"})
                  </div>
                )}
                {userResults.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-[14px] border border-[#dfe6ef]">
                    {userResults.map((user) => (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserResults([]);
                        }}
                        className="flex w-full items-center justify-between border-b border-[#edf1f6] px-3 py-2 text-left text-xs hover:bg-[#f8fafc]"
                      >
                        <span>{user.name || "Unnamed"}</span>
                        <span className="text-[#8b98ab]">{user.email || user.phone || "N/A"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#64748b]">Notification content</label>
            <input
              className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="min-h-[120px] w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
              placeholder="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
            />
            <ImageUploadPreview
              file={imageFile}
              label="Notification image preview"
              hint="JPG, PNG or WebP up to 4 MB. The server automatically optimizes it for push notifications."
              heightClass="h-36"
              onClear={() => setImageFile(null)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={sendNotification} disabled={!canSend || sending}>
            {sending ? "Sending..." : "Send notification"}
          </Button>
          {status && <span className="text-xs text-emerald-600">{status}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#101827]">Recent notifications</h3>
          <button
            type="button"
            onClick={loadNotifications}
            className="text-xs font-semibold text-[#64748b]"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-[#f8fafc] text-[#53637a]">
              <tr>
                <th className="text-left px-3 py-2 md:px-4">Title</th>
                <th className="text-left px-3 py-2 md:px-4">Message</th>
                <th className="text-left px-3 py-2 md:px-4">User</th>
                <th className="text-left px-3 py-2 md:px-4">Sent</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 md:px-4">{n.title || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{n.message || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{n.user?.name || n.user_id || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{formatDateTime(n.created_at)}</td>
                </tr>
              ))}
              {!notifications.length && (
                <tr>
                  <td className="px-4 py-4 text-[#64748b]" colSpan={4}>
                    {loadingList ? "Loading..." : "No notifications found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="AI decision details">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5eaf1] bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[#101827]">AI decision #{selectedDecision.id}</h3>
                <p className="mt-1 text-xs text-[#64748b]">{AUTOMATION_CAMPAIGNS[selectedDecision.campaign]?.[0] || selectedDecision.campaign}</p>
              </div>
              <button type="button" onClick={() => setSelectedDecision(null)} className="text-sm font-semibold text-[#64748b] hover:text-[#101827]">Close</button>
            </div>

            <div className="grid gap-px bg-[#e8edf4] sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Status", selectedDecision.converted_at ? "Ordered" : selectedDecision.opened_at ? "Opened" : selectedDecision.status],
                ["AI score", Number(selectedDecision.score || 0).toFixed(0)],
                ["Copy source", selectedDecision.copy_source || "Not generated"],
                ["User", selectedDecision.user?.name || `User #${selectedDecision.user_id}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-white px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase text-[#7a8799]">{label}</div>
                  <div className="mt-1 text-sm font-semibold capitalize text-[#26364a]">{value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-5 px-5 py-5">
              <section>
                <h4 className="text-xs font-semibold uppercase text-[#7a8799]">Notification content</h4>
                <div className="mt-2 border-l-4 border-red-600 bg-[#f8fafc] px-4 py-3">
                  <div className="font-semibold text-[#172033]">{selectedDecision.title || "Pending generation"}</div>
                  <div className="mt-1 text-sm leading-6 text-[#526176]">{selectedDecision.message || "Message has not been generated."}</div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase text-[#7a8799]">User and destination</h4>
                <dl className="mt-2 divide-y divide-[#edf1f6] border-y border-[#edf1f6] text-sm">
                  {[
                    ["Name", selectedDecision.user?.name || "-"],
                    ["Phone", selectedDecision.user?.phone || "-"],
                    ["Email", selectedDecision.user?.email || "-"],
                    ["Deep link", selectedDecision.deep_link || "-"],
                    ["Dedupe key", selectedDecision.dedupe_key || "-"],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[150px,1fr]">
                      <dt className="font-semibold text-[#64748b]">{label}</dt>
                      <dd className="break-all text-[#26364a]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase text-[#7a8799]">Decision timeline</h4>
                <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Created", selectedDecision.created_at],
                    ["Scheduled", selectedDecision.scheduled_for],
                    ["Sent", selectedDecision.sent_at],
                    ["Opened", selectedDecision.opened_at],
                    ["Order conversion", selectedDecision.converted_at],
                    ["Failed", selectedDecision.failed_at],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-[#edf1f6] pb-2">
                      <dt className="text-xs font-semibold text-[#7a8799]">{label}</dt>
                      <dd className="mt-1 text-sm text-[#26364a]">{value ? formatDateTime(value) : "-"}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase text-[#7a8799]">Verified decision context</h4>
                <dl className="mt-2 divide-y divide-[#edf1f6] border-y border-[#edf1f6] text-sm">
                  {Object.entries(selectedDecision.context || {}).map(([key, value]) => (
                    <div key={key} className="grid gap-1 py-2.5 sm:grid-cols-[180px,1fr]">
                      <dt className="font-semibold text-[#64748b]">{key.replaceAll("_", " ")}</dt>
                      <dd className="break-words text-[#26364a]">{value === null || value === "" ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {selectedDecision.failure_message && (
                <section className="border-l-4 border-red-600 bg-red-50 px-4 py-3">
                  <h4 className="text-xs font-semibold uppercase text-red-700">Failure or suppression reason</h4>
                  <p className="mt-1 text-sm text-red-800">{selectedDecision.failure_message}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

