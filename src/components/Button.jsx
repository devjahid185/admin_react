export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-700/20 disabled:cursor-not-allowed disabled:opacity-60";
  const styles = {
    primary: "bg-red-700 text-white hover:bg-red-800",
    ghost: "border border-red-200 text-red-800 hover:bg-red-50",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}


