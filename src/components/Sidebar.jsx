import { useEffect, useMemo, useState } from "react";

const ICONS = {
  dashboard: "DB",
  profile: "PR",
  users: "US",
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
  notifications: "PN",
  reviews: "RV",
  reports: "RP",
  messages: "MS",
  payments: "PY",
  "sms-settings": "SM",
  "email-settings": "EM",
};

function iconFor(item) {
  return ICONS[item.slug] || item.name?.slice(0, 2)?.toUpperCase() || "AD";
}

function chevron(open) {
  return open ? "−" : "+";
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
      next.add("Core");
      next.add(activeGroup);
      return next;
    });
  }, [activeGroup]);

  const toggleGroup = (group) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (group === "Core") {
        next.add(group);
        return next;
      }
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-72 flex-col bg-white text-[#17233b]">
      <div className="px-4 pt-4">
        <div className="rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-[14px] border border-[#dfe6ef] bg-white p-1 shadow-sm">
              <img src="/logo_bholavashi_square.png" alt="Bholabashi" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <img src="/logo_bholavashi_landscape.png" alt="Bholabashi" className="h-7 max-w-[150px] object-contain object-left" />
              <p className="mt-0.5 text-[11px] font-medium text-[#53637a]">Secure Admin Console</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-[14px] border border-red-100 bg-red-50/70 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ee0012]">Workspace</p>
          <p className="mt-1 text-sm font-bold text-[#101827]">Bholabashi Operations</p>
        </div>
      </div>

      {mobile && (
        <div className="px-4 pt-4">
          <button
            onClick={onClose}
            className="w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm font-semibold text-[#24324a] shadow-sm"
          >
            Close menu
          </button>
        </div>
      )}

      <nav className="scrollbar-hidden flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-3">
          {grouped.map(([group, items]) => (
            <div key={group} className="rounded-[16px] border border-[#edf1f6] bg-white">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className={`flex w-full items-center justify-between rounded-[16px] px-3 py-3 text-left transition ${
                  activeGroup === group ? "bg-red-50 text-[#ee0012]" : "text-[#263751] hover:bg-[#f8fafc]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ee0012]">{group}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-[#64748b]">{items.length} items</span>
                </span>
                <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe6ef] bg-white text-base font-bold text-[#ee0012]">
                  {chevron(openGroups.has(group))}
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  openGroups.has(group) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 px-2 pb-2">
                    {items.map((item) => {
                      const active = item.slug === activeKey;
                      return (
                        <button
                          key={item.slug}
                          onClick={() => onSelect?.(item)}
                          className={`group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                            active
                              ? "bg-[#ee0012] text-white shadow-md shadow-red-700/20"
                              : "text-[#263751] hover:bg-[#f4f7fb] hover:text-[#ee0012]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-bold ${
                              active ? "bg-white/18 text-white" : "bg-[#f1f5f9] text-[#60708a] group-hover:bg-red-50 group-hover:text-[#ee0012]"
                            }`}
                          >
                            {iconFor(item)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          {active && <span className="h-2 w-2 rounded-full bg-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
