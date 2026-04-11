"use client";

import { CKEditor } from "ckeditor4-react";
import { useRef, useCallback } from "react";

export default function CKEditorComponent({
  initialData = "",
  onChange,
  config = {},
}) {
  const mathJaxTimeout = useRef(null);

  const defaultConfig = {
    height: 400,
    versionCheck: false,
    extraPlugins: "mathjax,uploadimage",
    mathJaxLib:
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS_HTML",
    toolbar: "Full",
    notification: false,

    // ── Image upload configuration ──
    uploadUrl: "/api/upload",
    filebrowserUploadUrl: "/api/upload",
    filebrowserUploadMethod: "form",
    imageUploadUrl: "/api/upload",

    ...config,
  };

  const handleChange = (event) => {
    const data = event.editor.getData();

    onChange(data);

    // debounce MathJax
    if (window.MathJax?.Hub) {
      if (mathJaxTimeout.current) {
        clearTimeout(mathJaxTimeout.current);
      }

      mathJaxTimeout.current = setTimeout(() => {
        window.MathJax?.Hub.Queue(["Typeset", window.MathJax?.Hub]);
      }, 500);
    }
  };

  /**
   * Upload a File object to /api/upload and return the Vultr URL.
   */
  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("upload", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();

    if (!json.uploaded || !json.url) {
      throw new Error(json?.error?.message || "Upload failed");
    }
    return json.url;
  }, []);

  /**
   * When the editor instance is ready, attach custom handlers for
   * drag-and-drop and clipboard paste of image files. This serves as a
   * fallback in case the built-in uploadimage plugin doesn't catch
   * certain paste/drop events (e.g. screenshots from clipboard).
   */
  const handleInstanceReady = useCallback(
    (event) => {
      const editor = event.editor;

      // Helper: process a DataTransfer and insert images
      const processFiles = async (dataTransfer, editor) => {
        if (!dataTransfer || !dataTransfer.files || dataTransfer.files.length === 0) return false;

        let handled = false;
        for (let i = 0; i < dataTransfer.files.length; i++) {
          const file = dataTransfer.files[i];
          if (!file.type.startsWith("image/")) continue;

          handled = true;
          try {
            const url = await uploadFile(file);
            editor.insertHtml(
              `<img src="${url}" alt="${file.name || "image"}" style="max-width:100%;" />`
            );
          } catch (err) {
            console.error("CKEditor image upload failed:", err);
          }
        }
        return handled;
      };

      // ── Native drop zone on the editable area ──
      const editable = editor.editable();
      if (editable && editable.$) {
        const el = editable.$;

        el.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        el.addEventListener("drop", async (e) => {
          if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            const hasImages = Array.from(e.dataTransfer.files).some((f) =>
              f.type.startsWith("image/")
            );
            if (hasImages) {
              e.preventDefault();
              e.stopPropagation();
              await processFiles(e.dataTransfer, editor);
            }
          }
        });
      }

      // ── Clipboard paste fallback for images ──
      editor.on("paste", async (evt) => {
        if (
          evt.data &&
          evt.data.dataTransfer &&
          evt.data.dataTransfer.getFilesCount() > 0
        ) {
          const dt = evt.data.dataTransfer;
          const files = [];
          for (let i = 0; i < dt.getFilesCount(); i++) {
            const f = dt.getFile(i);
            if (f && f.type && f.type.startsWith("image/")) {
              files.push(f);
            }
          }

          if (files.length > 0) {
            evt.cancel(); // prevent default paste of blob/data-url
            for (const file of files) {
              try {
                const url = await uploadFile(file);
                editor.insertHtml(
                  `<img src="${url}" alt="${file.name || "image"}" style="max-width:100%;" />`
                );
              } catch (err) {
                console.error("CKEditor paste upload failed:", err);
              }
            }
          }
        }
      });
    },
    [uploadFile]
  );

  return (
    <CKEditor
      initData={initialData}
      config={defaultConfig}
      onChange={handleChange}
      onInstanceReady={handleInstanceReady}
    />
  );
}
