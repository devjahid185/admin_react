export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60";
  const styles = {
    primary: "bg-[#ee0012] text-white shadow-sm shadow-red-900/10 hover:bg-[#d90010]",
    ghost:
      "border border-[#dfe6ef] bg-white text-[#24324a] shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700",
    dark: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
  };

  return (
    <button className={`${base} ${styles[variant] || styles.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
