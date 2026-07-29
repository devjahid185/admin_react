import { useEffect, useRef } from "react";
import { apiUpload } from "../lib/api.js";

export default function QuillEditor({
  value = "",
  onChange,
  placeholder = "",
  token,
  targetType,
  targetId,
  onRequireSave,
}) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    if (!window.Quill) return;

    const quill = new window.Quill(containerRef.current, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "blockquote", "code-block", "image", "video"],
          [{ align: [] }],
          ["clean"],
        ],
      },
    });

    quillRef.current = quill;
    if (value) {
      quill.root.innerHTML = value;
      lastValueRef.current = value;
    }

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      const text = quill.getText().trim();
      const normalized = text ? html : "";
      if (normalized === lastValueRef.current) return;
      lastValueRef.current = normalized;
      onChange?.(normalized);
    });

    const toolbar = quill.getModule("toolbar");
    if (toolbar) {
      toolbar.addHandler("image", async () => {
        let resolvedId = targetId;
        if (!resolvedId) {
          resolvedId = await onRequireSave?.();
        }
        if (!resolvedId) {
          return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const formData = new FormData();
            formData.append("section", targetType);
            formData.append("target_type", targetType);
            formData.append("target_id", String(resolvedId));
            formData.append("images[]", file);
            formData.append("set_primary", "true");
            const data = await apiUpload("/media/upload", { token, formData });
            const url = data?.media?.[0]?.url;
            if (url) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range?.index ?? 0, "image", url, "user");
              quill.setSelection((range?.index ?? 0) + 1, 0);
            }
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert("Image upload failed.");
          }
        };
        input.click();
      });

      toolbar.addHandler("video", () => {
        // eslint-disable-next-line no-alert
        const url = prompt("Paste video URL (YouTube/Vimeo)");
        if (!url) return;
        const range = quill.getSelection(true);
        quill.insertEmbed(range?.index ?? 0, "video", url, "user");
        quill.setSelection((range?.index ?? 0) + 1, 0);
      });
    }
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value === lastValueRef.current) return;
    quill.root.innerHTML = value || "";
    lastValueRef.current = value || "";
  }, [value]);

  return <div ref={containerRef} className="quill-editor" />;
}


