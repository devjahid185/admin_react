import { useMemo } from "react";

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

  const shell = mobile ? "bg-red-800 text-white" : "bg-red-800 text-white";
  return (
    <aside className={`w-72 h-full ${shell}`}>
      <div className="px-5 py-4 border-b border-red-700/70 flex items-center justify-between text-red-50">
        <span className="text-xs uppercase tracking-wide">Navigation</span>
        {mobile && (
          <button onClick={onClose} className="text-xs text-red-100">
            Close
          </button>
        )}
      </div>
      <div className="px-5 py-4 space-y-5">
        {grouped.map(([group, items]) => (
          <div key={group}>
            <p className="text-[11px] uppercase tracking-widest text-red-100/70">{group}</p>
            <div className="mt-2 space-y-1">
              {items.map((item) => {
                const active = item.slug === activeKey;
                return (
                  <button
                    key={item.slug}
                    onClick={() => onSelect?.(item)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                      active
                        ? "bg-white text-red-800 shadow-sm"
                        : "text-red-50 hover:bg-red-700/70"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}


