import LogoMark from "../components/LogoMark.jsx";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid bg-stone-50 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-red-800 p-10 text-white">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <img
              src="/logo_bholavashi_landscape.png"
              alt="Bholabashi"
              className="h-7"
            />
            <p className="text-sm text-red-100/80">Operations & moderation console</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-red-100/70">Highlights</p>
          <ul className="mt-4 space-y-2 text-sm text-red-50">
            <li>User and service overview</li>
            <li>Verification and report management</li>
            <li>Module monitoring and audits</li>
          </ul>
        </div>
        <div className="text-xs text-red-100/70">© 2026 Bholabashi</div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <LogoMark />
            <div>
              <img
                src="/logo_bholavashi_landscape.png"
                alt="Bholabashi"
                className="h-7"
              />
              <p className="text-sm text-slate-500">Operations & moderation console</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}


