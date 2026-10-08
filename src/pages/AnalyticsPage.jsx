import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

const CARD = "rounded-2xl border border-[#ececec] bg-white shadow-[0_18px_45px_rgba(17,17,17,0.06)]";

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className={`${CARD} p-5 ${accent ? "border-[#ee0012]/25 bg-[#fff7f7]" : ""}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8a8a]">{label}</p>
      <p className={`mt-3 text-3xl font-black ${accent ? "text-[#ee0012]" : "text-[#111]"}`}>{formatNumber(value)}</p>
      {hint && <p className="mt-2 text-sm font-semibold text-[#6b7280]">{hint}</p>}
    </div>
  );
}

function RankedList({ title, items = [], labelKey }) {
  const max = Math.max(...items.map((item) => Number(item.total || 0)), 1);

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[#111]">{title}</h3>
        <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-black text-[#ee0012]">Top {items.length}</span>
      </div>
      <div className="mt-5 space-y-4">
        {items.length === 0 && <p className="rounded-xl bg-[#f8f8f8] p-4 text-sm font-semibold text-[#777]">No data yet.</p>}
        {items.map((item) => {
          const width = `${Math.max(8, (Number(item.total || 0) / max) * 100)}%`;
          return (
            <div key={item[labelKey]} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-bold text-[#222]">{item[labelKey] || "unknown"}</span>
                <span className="font-black text-[#ee0012]">{formatNumber(item.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f1f1f1]">
                <div className="h-full rounded-full bg-[#ee0012]" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HourlyChart({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.events || 0)), 1);

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#111]">Realtime trend</h3>
          <p className="mt-1 text-sm font-semibold text-[#777]">Events grouped by hour</p>
        </div>
        <span className="rounded-full border border-[#ee0012]/20 bg-white px-3 py-1 text-xs font-black text-[#ee0012]">Auto refresh</span>
      </div>
      <div className="mt-6 flex h-52 items-end gap-2 overflow-x-auto rounded-2xl bg-[#fafafa] p-4">
        {data.length === 0 && (
          <div className="grid h-full w-full place-items-center text-sm font-semibold text-[#777]">No trend data yet.</div>
        )}
        {data.map((item) => {
          const height = `${Math.max(5, (Number(item.events || 0) / max) * 100)}%`;
          return (
            <div key={item.bucket} className="flex h-full min-w-[28px] flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t-xl bg-[#ee0012] shadow-[0_8px_20px_rgba(238,0,18,0.18)]"
                style={{ height }}
                title={`${item.bucket}: ${item.events} events`}
              />
              <span className="text-[10px] font-bold text-[#999]">{String(item.bucket || "").slice(11, 13)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentLog({ items = [] }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="border-b border-[#ececec] p-5">
        <h3 className="text-lg font-black text-[#111]">Live event log</h3>
        <p className="mt-1 text-sm font-semibold text-[#777]">Last 30 app events from users and sessions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa] text-xs font-black uppercase tracking-[0.12em] text-[#777]">
            <tr>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">Screen</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Device</th>
              <th className="px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {items.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center font-semibold text-[#777]" colSpan={5}>No events received yet.</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[#fff7f7]">
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-black text-[#ee0012]">{item.event_name}</span>
                </td>
                <td className="px-5 py-4 font-bold text-[#222]">{item.screen_name || "-"}</td>
                <td className="px-5 py-4 text-[#555]">{item.user?.name || item.user?.phone || (item.user_id ? `#${item.user_id}` : "Guest")}</td>
                <td className="px-5 py-4 text-[#555]">{[item.platform, item.app_version].filter(Boolean).join(" · ") || "-"}</td>
                <td className="px-5 py-4 font-semibold text-[#777]">{formatTime(item.occurred_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsPage({ token }) {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await apiRequest(`/admin/analytics/overview?hours=${hours}`, { token });
      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, [hours]);

  const summary = data?.summary || {};
  const trend = useMemo(() => data?.hourly || [], [data]);

  return (
    <div className="space-y-5">
      <div className={`${CARD} overflow-hidden`}>
        <div className="bg-[#ee0012] p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Bholavashi monitoring</p>
              <h2 className="mt-2 text-3xl font-black">App Analytics Center</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-white/85">
                Realtime activity, user sessions, screen views, conversion events and operational logs from the mobile app.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 6, 24, 168].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHours(value)}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    hours === value ? "bg-white text-[#ee0012]" : "bg-white/12 text-white hover:bg-white/20"
                  }`}
                >
                  {value === 168 ? "7 days" : `${value}h`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm font-semibold text-[#777]">
          <span>{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for first refresh"}</span>
          <button type="button" onClick={() => load()} className="rounded-xl border border-[#ececec] bg-white px-4 py-2 font-black text-[#111] transition hover:border-[#ee0012]/40 hover:text-[#ee0012]">
            Refresh now
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] p-4 text-sm font-bold text-[#b91c1c]">{error}</div>}

      {loading && !data ? (
        <div className={`${CARD} p-8 text-center font-bold text-[#777]`}>Loading analytics...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Events" value={summary.events_window} hint={`Last ${hours === 168 ? "7 days" : `${hours} hours`}`} accent />
            <StatCard label="Active sessions" value={summary.active_sessions_window} hint="Unique sessions" />
            <StatCard label="Active users" value={summary.active_users_window} hint="Logged in users" />
            <StatCard label="Today" value={summary.events_today} hint="All events today" />
            <StatCard label="7 days" value={summary.events_week} hint="Weekly total" />
          </div>

          <HourlyChart data={trend} />

          <div className="grid gap-5 xl:grid-cols-2">
            <RankedList title="Top events" items={data?.top_events || []} labelKey="event_name" />
            <RankedList title="Top screens" items={data?.top_screens || []} labelKey="screen_name" />
          </div>

          <RecentLog items={data?.recent || []} />
        </>
      )}
    </div>
  );
}
