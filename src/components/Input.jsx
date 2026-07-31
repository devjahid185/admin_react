export default function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-[#24324a]">
      {label}
      <input
        className="mt-1.5 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
        {...props}
      />
    </label>
  );
}
