import { useEffect, useMemo, useState } from "react";

const ICONS = {
  dashboard: "DB",
  profile: "PR",
  users: "US",
  "staff-management": "ST",
  workers: "WK",
  businesses: "BZ",
  marketplace: "MK",
  jobs: "JB",
  doctors: "DR",
  hospitals: "HP",
  hotels: "HT",
  restaurants: "RS",
  property: "PT",
  education: "ED",
  blood: "BD",
  courier: "CR",
  "car-rental": "VH",
  launches: "LN",
  electricity: "EL",
  emergency: "ER",
  news: "NW",
  notices: "NT",
  updates: "UP",
  faqs: "FQ",
  "home-banners": "BN",
  "home-service-shortcuts": "HS",
  notifications: "PN",
  reviews: "RV",
  reports: "RP",
  messages: "MS",
  payments: "PY",
  "ai-social": "AI",
  "medicine-payment-settings": "MP",
  "sms-settings": "SM",
  "email-settings": "EM",
  riders: "RD",
};

const SIDEBAR_CSS = `
@keyframes sbFade{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
@keyframes sbRing{0%{box-shadow:0 0 0 0 rgba(238,0,18,.45)}100%{box-shadow:0 0 0 8px rgba(238,0,18,0)}}
.sb-fade{opacity:0;animation:sbFade .5s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.sb-ring{animation:sbRing 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){.sb-fade,.sb-ring{animation:none!important;opacity:1!important}}
`;

function iconFor(item) {
  return ICONS[item.slug] || item.name?.slice(0, 2)?.toUpperCase() || "AD";
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

export default function Sidebar({ modules = [], activeKey = "dashboard", onSelect, onClose, mobile }) {
  const grouped = useMemo(() => {
    const map = new Map();
    modules.forEach((mod) => {
      const group = mod.group_name || "General";
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(mod);
    });
    return Array.from(map.entries());
  }, [modules]);

  const activeGroup = useMemo(() => {
    const found = modules.find((mod) => mod.slug === activeKey);
    return found?.group_name || "Core";
  }, [activeKey, modules]);

  const [openGroups, setOpenGroups] = useState(() => new Set(["Core"]));

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.add(activeGroup);
      return next;
    });
  }, [activeGroup]);

  const toggleGroup = (group) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-[#ececec] bg-white text-[#111]">
      <style>{SIDEBAR_CSS}</style>

      <div className="sb-fade px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="h-12 w-12 shrink-0 rounded-xl border border-[#ececec] bg-white p-1">
            <img src="/logo_bholavashi_square.png" alt="Bholabashi" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <img src="/logo_bholavashi_landscape.png" alt="Bholabashi" className="h-7 max-w-[150px] object-contain object-left" />
            <p className="mt-0.5 text-[11px] font-medium text-[#6b7280]">Secure Admin Console</p>
          </div>
        </div>
      </div>

      <div className="sb-fade px-4 pt-4" style={{ "--d": "80ms" }}>
        <div className="flex items-center justify-between rounded-2xl border border-[#ececec] border-l-4 border-l-[#ee0012] bg-white px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#ee0012]">Workspace</p>
            <p className="mt-1 text-sm font-bold text-[#111]">Bholabashi Operations</p>
          </div>
          <span className="sb-ring h-2.5 w-2.5 rounded-full bg-[#ee0012]" aria-hidden="true" />
        </div>
      </div>

      {mobile && (
        <div className="px-4 pt-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[#ececec] bg-white px-3 py-2 text-sm font-semibold text-[#111] transition hover:border-[#ee0012]/40 hover:text-[#ee0012]"
          >
            Close menu
          </button>
        </div>
      )}

      <nav className="scrollbar-hidden flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-2">
          {grouped.map(([group, items], gi) => {
            const open = openGroups.has(group);
            const isActiveGroup = activeGroup === group;
            return (
              <div key={group} className="sb-fade" style={{ "--d": `${160 + gi * 40}ms` }}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                    isActiveGroup ? "text-[#ee0012]" : "text-[#6b7280] hover:bg-[#fafafa] hover:text-[#111]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{group}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActiveGroup ? "bg-[#ee0012] text-white" : "bg-[#f3f4f6] text-[#6b7280]"
                      }`}
                    >
                      {items.length}
                    </span>
                  </span>
                  <Chevron open={open} />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pb-2 pt-0.5">
                      {items.map((item, i) => {
                        const active = item.slug === activeKey;
                        return (
                          <button
                            key={item.slug}
                            onClick={() => onSelect?.(item)}
                            style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition duration-300 ${
                              open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                            } ${
                              active
                                ? "bg-[#ee0012] text-white shadow-[0_6px_16px_rgba(238,0,18,0.25)]"
                                : "text-[#374151] hover:bg-[#fef2f2] hover:text-[#ee0012]"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-[#f3f4f6] text-[#6b7280] group-hover:bg-white group-hover:text-[#ee0012]"
                              }`}
                            >
                              {iconFor(item)}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{item.name}</span>
                            {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
