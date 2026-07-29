import { useState } from "react";
import LogoMark from "../components/LogoMark.jsx";
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
    <div className="min-h-screen bg-stone-50">
      <div className="min-h-screen">
        <div className="hidden md:flex w-72 bg-red-800 text-white flex-col fixed inset-y-0 left-0 z-30 shadow-xl shadow-red-950/10">
          <div className="h-16 px-5 flex items-center gap-3 border-b border-red-700/70 flex-shrink-0 bg-red-900/35">
            <LogoMark />
            <div>
              <img
                src="/logo_bholavashi_landscape.png"
                alt="Bholabashi"
                className="h-6"
              />
              <p className="text-xs text-red-100/75">Operations Console</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            <Sidebar modules={modules} activeKey={activeKey} onSelect={onSelectModule} />
          </div>
        </div>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/45"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-72 shadow-xl">
              <div className="h-full bg-red-800 text-white flex flex-col">
                <div className="h-16 px-5 flex items-center justify-between border-b border-red-700/70 flex-shrink-0 bg-red-900/35">
                  <div className="flex items-center gap-3">
                    <LogoMark />
                    <div>
                      <img
                        src="/logo_bholavashi_landscape.png"
                        alt="Bholabashi"
                        className="h-6"
                      />
                      <p className="text-xs text-red-100/75">Operations Console</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-xs text-red-50"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hidden">
                  <Sidebar
                    modules={modules}
                    activeKey={activeKey}
                    onSelect={(item) => {
                      onSelectModule?.(item);
                      setSidebarOpen(false);
                    }}
                    mobile
                    onClose={() => setSidebarOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 overflow-x-hidden md:pl-72">
          <header className="h-16 bg-white border-b border-red-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
            <div>
              <p className="text-lg font-semibold text-slate-950">{title}</p>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-800"
              >
                Menu
              </button>
              <Button variant="ghost" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </header>
          <div className="p-4 md:p-6">
            {children}
            <footer className="mt-10 text-xs text-slate-400">© 2026 Bholabashi Admin Panel</footer>
          </div>
        </main>
      </div>
    </div>
  );
}


