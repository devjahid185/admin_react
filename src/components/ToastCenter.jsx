import { useEffect, useState } from "react";

const tones = {
  success: {
    dot: "bg-emerald-500",
    border: "border-emerald-100",
    title: "Success",
  },
  error: {
    dot: "bg-red-500",
    border: "border-red-100",
    title: "Problem",
  },
  warning: {
    dot: "bg-amber-500",
    border: "border-amber-100",
    title: "Attention",
  },
  info: {
    dot: "bg-sky-500",
    border: "border-sky-100",
    title: "Notice",
  },
};

export function pushToast(message, type = "info", options = {}) {
  if (!message) return;
  window.dispatchEvent(
    new CustomEvent("admin-toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        message,
        title: options.title,
        duration: options.duration ?? 3800,
      },
    }),
  );
}

export default function ToastCenter() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const detail = event.detail || {};
      const toast = {
        id: detail.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: detail.type || "info",
        title: detail.title,
        message: detail.message || "",
        duration: detail.duration ?? 3800,
      };
      setItems((prev) => [toast, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.duration);
    };

    window.addEventListener("admin-toast", onToast);
    return () => window.removeEventListener("admin-toast", onToast);
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
      {items.map((item) => {
        const tone = tones[item.type] || tones.info;
        return (
          <div
            key={item.id}
            className={`pointer-events-auto w-full max-w-sm translate-y-0 rounded-[16px] border ${tone.border} bg-white/95 p-4 text-sm text-[#24324a] shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur animate-[toastIn_180ms_ease-out]`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${tone.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#101827]">{item.title || tone.title}</p>
                <p className="mt-0.5 leading-5 text-[#53637a]">{item.message}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-lg leading-none text-[#94a3b8] transition hover:bg-slate-100 hover:text-[#24324a]"
                onClick={() => setItems((prev) => prev.filter((toast) => toast.id !== item.id))}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
