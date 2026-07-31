import LogoMark from "../components/LogoMark.jsx";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#f4f6f9] p-4 text-[#101827] md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[22px] border border-[#dfe6ef] bg-white shadow-xl shadow-slate-900/5 md:min-h-[calc(100vh-4rem)] md:grid-cols-[1.05fr,0.95fr]">
        <section className="hidden flex-col justify-between bg-[#030716] p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <img src="/logo_bholavashi_landscape.png" alt="Bholabashi" className="h-8 object-contain" />
                <p className="mt-1 text-sm text-white/65">Secure Admin Console</p>
              </div>
            </div>
            <div className="mt-16 max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-red-300">Operations</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Clean control room for every Bholabashi service.
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/70">
                Manage users, listings, reviews, notifications, updates, SMS, email and service data from one focused console.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Moderation", "Content", "Services"].map((item) => (
              <div key={item} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{item}</p>
                <p className="mt-1 text-xs text-white/55">Ready</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 md:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <LogoMark />
              <div>
                <img src="/logo_bholavashi_landscape.png" alt="Bholabashi" className="h-8 object-contain" />
                <p className="text-sm text-[#64748b]">Secure Admin Console</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-[#dfe6ef] bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ee0012]">Admin Panel</p>
              <h2 className="mt-3 text-2xl font-bold text-[#101827]">{title}</h2>
              <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p>
              <div className="mt-7">{children}</div>
            </div>
            <p className="mt-5 text-center text-xs font-medium text-[#8b98ab]">
              © 2026 Bholabashi. Restricted access for authorized admins only.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
