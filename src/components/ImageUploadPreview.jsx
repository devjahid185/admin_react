import { useEffect, useMemo, useState } from "react";

export default function ImageUploadPreview({
  file,
  url = "",
  label = "Image preview",
  hint = "Choose an image to preview before saving.",
  heightClass = "h-40",
  onClear,
}) {
  const [localUrl, setLocalUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setLocalUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const previewUrl = localUrl || url || "";
  const name = useMemo(() => file?.name || url?.split("/").pop() || "", [file, url]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc]">
      <div className={`${heightClass} relative bg-white`}>
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[#8b98ab]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2f7] text-xl">+</span>
            <span className="text-xs font-bold">{hint}</span>
          </div>
        )}
        {previewUrl && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-red-600 shadow-sm"
          >
            Remove
          </button>
        )}
        {previewUrl && (
          <div className="absolute inset-x-2 bottom-2 rounded-[10px] bg-slate-950/65 px-3 py-2 text-xs font-bold text-white">
            <span className="block truncate">{name || label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
