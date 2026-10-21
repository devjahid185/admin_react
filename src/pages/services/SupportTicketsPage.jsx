import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { apiRequest } from "../../lib/api.js";

const dateTime = (value) => (value ? new Date(value).toLocaleString("bn-BD") : "-");

function personFor(ticket) {
  if (ticket.type === "food") return ticket.user || {};
  return ticket.rider?.user || ticket.rider || {};
}

function TicketList({ rows, selected, onSelect }) {
  if (!rows.length) {
    return (
      <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
        <div>
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f1f5f9] text-xl text-[#64748b]">✓</div>
          <p className="mt-3 font-bold text-[#24324a]">No tickets found</p>
          <p className="mt-1 text-sm text-[#94a3b8]">New support requests will appear here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#edf1f6]">
      {rows.map((ticket) => {
        const person = personFor(ticket);
        const active = selected?.id === ticket.id && selected?.type === ticket.type;
        return (
          <button
            type="button"
            key={`${ticket.type}-${ticket.id}`}
            onClick={() => onSelect(ticket)}
            className={`w-full px-4 py-4 text-left transition ${active ? "bg-red-50" : "bg-white hover:bg-[#f8fafc]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ticket.admin_reply ? "bg-emerald-500" : "bg-[#ee0012]"}`} />
                  <p className="truncate font-black text-[#101827]">{ticket.subject || "Support request"}</p>
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-[#64748b]">
                  {person.name || person.phone || `${ticket.type === "food" ? "Customer" : "Rider"} #${ticket.type === "food" ? ticket.user_id : ticket.rider_id}`}
                  {ticket.food_order_id ? ` • Order #${ticket.food_order_id}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-[#94a3b8]">{dateTime(ticket.created_at)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#53637a]">{ticket.message || "-"}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={`rounded-[8px] px-2 py-1 text-[10px] font-black uppercase ${ticket.type === "food" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                {ticket.type === "food" ? "Customer" : "Rider"}
              </span>
              <StatusBadge value={ticket.status} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TicketDetails({ ticket, token, onUpdated, onClose }) {
  const [reply, setReply] = useState(ticket?.admin_reply || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReply(ticket?.admin_reply || "");
    setError("");
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="grid min-h-[520px] place-items-center px-8 text-center">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-2xl text-red-700">↗</div>
          <h3 className="mt-4 text-lg font-black text-[#101827]">Select a support ticket</h3>
          <p className="mt-1 max-w-xs text-sm text-[#64748b]">Open a ticket to review the message and send a reply.</p>
        </div>
      </div>
    );
  }

  const person = personFor(ticket);
  const sendReply = async (status) => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const result = await apiRequest(`/admin/support-tickets/${ticket.type}/${ticket.id}/reply`, {
        method: "POST",
        token,
        body: { reply: reply.trim(), status },
      });
      await onUpdated(result.ticket);
    } catch (err) {
      setError(err.message || "Reply পাঠানো যায়নি।");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-[520px] flex-col">
      <div className="border-b border-[#edf1f6] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#ee0012]">Ticket #{ticket.id}</span>
              <StatusBadge value={ticket.status} />
            </div>
            <h3 className="mt-2 break-words text-xl font-black text-[#101827]">{ticket.subject || "Support request"}</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[#dfe6ef] text-xl text-[#64748b] hover:bg-[#f8fafc] lg:hidden" aria-label="Close ticket">×</button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#94a3b8]">{ticket.type === "food" ? "Customer" : "Rider"}</p>
            <p className="mt-1 font-black text-[#24324a]">{person.name || "Name unavailable"}</p>
            <p className="mt-0.5 text-xs text-[#64748b]">{person.phone || person.email || "Contact unavailable"}</p>
          </div>
          <div className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#94a3b8]">Reference</p>
            <p className="mt-1 font-black text-[#24324a]">{ticket.food_order_id ? `Order #${ticket.food_order_id}` : `${ticket.type === "food" ? "Customer" : "Rider"} ticket`}</p>
            <p className="mt-0.5 text-xs text-[#64748b]">Created {dateTime(ticket.created_at)}</p>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#dfe6ef] bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#94a3b8]">Message</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#24324a]">{ticket.message || "-"}</p>
        </div>

        {ticket.admin_reply && (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Latest admin reply</p>
              <span className="text-[11px] font-semibold text-emerald-700">{dateTime(ticket.admin_replied_at || ticket.updated_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">{ticket.admin_reply}</p>
          </div>
        )}

        <div>
          <label htmlFor="support-reply" className="text-sm font-black text-[#24324a]">Reply to {ticket.type === "food" ? "customer" : "rider"}</label>
          <textarea
            id="support-reply"
            value={reply}
            maxLength={4000}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a clear support response..."
            rows={6}
            className="mt-2 w-full resize-y rounded-[14px] border border-[#dfe6ef] bg-white px-4 py-3 text-sm leading-6 text-[#101827] outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          />
          <div className="mt-1 flex justify-between gap-3 text-[11px] text-[#94a3b8]">
            <span>The user receives an in-app and push notification.</span>
            <span>{reply.length}/4000</span>
          </div>
        </div>

        {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#edf1f6] bg-[#f8fafc] px-5 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={!reply.trim() || sending} onClick={() => sendReply("reviewing")}>
          {sending ? "Sending..." : ticket.admin_reply ? "Update reply" : "Send reply"}
        </Button>
        <Button type="button" disabled={!reply.trim() || sending} onClick={() => sendReply("resolved")}>
          Send & resolve
        </Button>
      </div>
    </div>
  );
}

export default function SupportTicketsPage({ token }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/admin/support-tickets?per_page=100", { token });
      const merged = (result?.data || [])
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      setTickets(merged);
      setSelected((current) => {
        if (!current) return merged[0] || null;
        return merged.find((item) => item.id === current.id && item.type === current.type) || merged[0] || null;
      });
    } catch (err) {
      setError(err.message || "Support tickets load করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const counts = useMemo(() => ({
    all: tickets.length,
    active: tickets.filter((item) => ["open", "reviewing"].includes(item.status)).length,
    answered: tickets.filter((item) => Boolean(item.admin_reply)).length,
    resolved: tickets.filter((item) => ["resolved", "closed"].includes(item.status)).length,
  }), [tickets]);

  const visible = useMemo(() => tickets.filter((item) => {
    if (filter === "active") return ["open", "reviewing"].includes(item.status);
    if (filter === "answered") return Boolean(item.admin_reply);
    if (filter === "resolved") return ["resolved", "closed"].includes(item.status);
    return true;
  }), [tickets, filter]);

  const handleUpdated = async (updatedTicket) => {
    setSelected((current) => ({ ...current, ...updatedTicket, type: current.type }));
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[#dfe6ef] bg-white px-1 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Support Desk</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#101827]">Support Tickets</h2>
            <p className="mt-1 text-sm text-[#64748b]">Customer এবং rider-এর সমস্যা দেখুন, উত্তর দিন ও সমাধান করুন।</p>
          </div>
          <div className="flex gap-2">
            <div className="border-l-4 border-[#ee0012] bg-red-50 px-4 py-2">
              <p className="text-[10px] font-black uppercase text-red-600">Waiting</p>
              <p className="text-xl font-black text-red-700">{counts.active}</p>
            </div>
            <div className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-2">
              <p className="text-[10px] font-black uppercase text-emerald-600">Answered</p>
              <p className="text-xl font-black text-emerald-700">{counts.answered}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["active", "all", "answered", "resolved"].map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-[10px] border px-3 py-2 text-xs font-black capitalize transition ${filter === value ? "border-[#ee0012] bg-[#ee0012] text-white" : "border-[#dfe6ef] bg-white text-[#53637a] hover:border-red-200"}`}
          >
            {value} ({counts[value]})
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto rounded-[10px] border border-[#dfe6ef] bg-white px-3 py-2 text-xs font-black text-[#53637a] hover:bg-[#f8fafc]">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid overflow-hidden rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm lg:grid-cols-[minmax(320px,0.85fr)_minmax(440px,1.15fr)]">
        <div className={`${selected ? "hidden lg:block" : "block"} max-h-[720px] overflow-y-auto border-r border-[#edf1f6]`}>
          <TicketList rows={visible} selected={selected} onSelect={setSelected} />
        </div>
        <div className={`${selected ? "block" : "hidden lg:block"}`}>
          <TicketDetails ticket={selected} token={token} onUpdated={handleUpdated} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}
