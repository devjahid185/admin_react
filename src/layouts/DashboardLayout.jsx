import { useState } from "react";
import Button from "../components/Button.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function DashboardLayout({
  title,
  subtitle,
  onLogout,
  modules = [],
  activeKey = "dashboard",
  onSelectModule,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell h-screen overflow-hidden bg-[#f4f6f9] text-[#101827]">
      <div className="hidden md:block fixed inset-y-0 left-0 z-30 w-[304px] border-r border-[#dfe6ef] bg-white">
        <Sidebar modules={modules} activeKey={activeKey} onSelect={onSelectModule} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[304px] max-w-[86vw] border-r border-[#dfe6ef] bg-white shadow-2xl">
            <Sidebar
              modules={modules}
              activeKey={activeKey}
              mobile
              onClose={() => setSidebarOpen(false)}
              onSelect={(item) => {
                onSelectModule?.(item);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <main className="flex h-screen min-w-0 flex-col md:pl-[304px]">
        <header className="shrink-0 border-b border-[#dfe6ef] bg-white/95 px-4 py-4 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ee0012]">Admin Panel</p>
              <h1 className="mt-1 truncate text-xl font-bold text-[#101827]">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-[#64748b]">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 rounded-[14px] border border-[#dfe6ef] bg-white px-4 py-2 text-sm font-semibold text-[#24324a] shadow-sm sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                API Connected
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-[14px] border border-[#dfe6ef] bg-white px-4 py-2 text-sm font-semibold text-[#24324a] shadow-sm md:hidden"
              >
                Menu
              </button>
              <Button variant="ghost" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="scrollbar-hidden flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 md:px-6">
          {children}
          <footer className="mt-10 border-t border-[#dfe6ef] py-5 text-xs font-medium text-[#8b98ab]">
            © 2026 Bholabashi Admin Panel. Built for daily operations, moderation and service control.
          </footer>
        </div>
      </main>
    </div>
  );
}
