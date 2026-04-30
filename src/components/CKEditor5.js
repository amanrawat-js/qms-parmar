"use client";

import { useRef, useCallback } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Heading,
  Paragraph,
  Font,
  Alignment,
  Link,
  List,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageUpload,
  ImageInsert,
  ImageResize,
  ImageToolbar,
  ImageStyle,
  ImageCaption,
  MediaEmbed,
  RemoveFormat,
  SpecialCharacters,
  SpecialCharactersEssentials,
  HorizontalLine,
  FindAndReplace,
  Undo,
  SourceEditing,
  GeneralHtmlSupport,
  HtmlComment,
  PasteFromOffice,
  AutoLink,
  CodeBlock,
  Code,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

// ─── Constants ───
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

// ──────────────────────────────────────────
//  Custom Upload Adapter
//  POSTs files as multipart/form-data to /api/upload
//  (same endpoint used by CKEditor 4 — fully compatible)
// ──────────────────────────────────────────
class S3UploadAdapter {
  constructor(loader) {
    this.loader = loader;
    this.controller = null;
  }

  async upload() {
    const file = await this.loader.file;

    // Client-side validation
    if (!file || !file.type) {
      throw new Error("Invalid file");
    }
    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      throw new Error(`Unsupported image type: ${file.type}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 5 MB.`
      );
    }

    const formData = new FormData();
    formData.append("upload", file);

    this.controller = new AbortController();

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: this.controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Upload failed (${res.status})`);
    }

    const data = await res.json();

    if (!data.url) {
      throw new Error(data?.error?.message || "Upload failed: no URL returned");
    }

    // CKEditor 5 expects { default: url } for image URLs
    return { default: data.url };
  }

  abort() {
    if (this.controller) {
      this.controller.abort();
    }
  }
}

// Plugin factory that registers the custom upload adapter
function CustomUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new S3UploadAdapter(loader);
  };
}

// ──────────────────────────────────────────
//  Default editor plugins
// ──────────────────────────────────────────
const DEFAULT_PLUGINS = [
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Heading,
  Paragraph,
  Font,
  Alignment,
  Link,
  AutoLink,
  List,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageUpload,
  ImageInsert,
  ImageResize,
  ImageToolbar,
  ImageStyle,
  ImageCaption,
  MediaEmbed,
  RemoveFormat,
  SpecialCharacters,
  SpecialCharactersEssentials,
  HorizontalLine,
  FindAndReplace,
  Undo,
  SourceEditing,
  GeneralHtmlSupport,
  HtmlComment,
  PasteFromOffice,
  Code,
  CodeBlock,
  CustomUploadAdapterPlugin,
];

// ──────────────────────────────────────────
//  Default toolbar
// ──────────────────────────────────────────
const DEFAULT_TOOLBAR = {
  items: [
    "undo",
    "redo",
    "|",
    "heading",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "subscript",
    "superscript",
    "code",
    "|",
    "fontSize",
    "fontFamily",
    "fontColor",
    "fontBackgroundColor",
    "|",
    "alignment",
    "|",
    "bulletedList",
    "numberedList",
    "outdent",
    "indent",
    "|",
    "link",
    "insertImage",
    "insertTable",
    "blockQuote",
    "codeBlock",
    "horizontalLine",
    "specialCharacters",
    "|",
    "removeFormat",
    "sourceEditing",
    "findAndReplace",
  ],
  shouldNotGroupWhenFull: true,
};

// ──────────────────────────────────────────
//  CKEditor 5 Component
// ──────────────────────────────────────────
export default function CKEditorComponent({
  initialData = "",
  onChange,
  config = {},
}) {
  const mathJaxTimeout = useRef(null);

  // Build merged config
  const { height = 400, ...restConfig } = config;

  const editorConfig = {
    licenseKey: "GPL",
    plugins: DEFAULT_PLUGINS,
    toolbar: DEFAULT_TOOLBAR,
    image: {
      toolbar: [
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "|",
        "toggleImageCaption",
        "imageTextAlternative",
        "|",
        "imageResize",
      ],
      resizeUnit: "%",
      resizeOptions: [
        { name: "imageResize:original", value: null, label: "Original" },
        { name: "imageResize:25", value: "25", label: "25%" },
        { name: "imageResize:50", value: "50", label: "50%" },
        { name: "imageResize:75", value: "75", label: "75%" },
      ],
    },
    table: {
      contentToolbar: [
        "tableColumn",
        "tableRow",
        "mergeTableCells",
        "tableProperties",
        "tableCellProperties",
      ],
    },
    heading: {
      options: [
        { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
        { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
      ],
    },
    // GeneralHtmlSupport: preserve MathJax-related elements and arbitrary HTML
    // This ensures <span class="math-tex">, <script type="math/tex">, etc. survive editing
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
    },
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: "https://",
    },
    ...restConfig,
  };

  // ──────────────────────────────────────────
  //  onChange handler with MathJax debounce
  // ──────────────────────────────────────────
  const handleChange = useCallback(
    (event, editor) => {
      const data = editor.getData();
      onChange(data);

      if (typeof window !== "undefined" && window.MathJax?.Hub) {
        if (mathJaxTimeout.current) {
          clearTimeout(mathJaxTimeout.current);
        }
        mathJaxTimeout.current = setTimeout(() => {
          window.MathJax?.Hub.Queue(["Typeset", window.MathJax?.Hub]);
        }, 500);
      }
    },
    [onChange]
  );

  return (
    <div style={{ minHeight: height }}>
      <CKEditor
        editor={ClassicEditor}
        config={editorConfig}
        data={initialData}
        onChange={handleChange}
        onReady={(editor) => {
          // Set the editor height via the editable element
          const editableElement = editor.editing.view.document.getRoot();
          if (editableElement) {
            editor.editing.view.change((writer) => {
              writer.setStyle(
                "min-height",
                `${height}px`,
                editableElement
              );
            });
          }
        }}
      />
    </div>
  );
}
