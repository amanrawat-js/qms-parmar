"use client";

import { useEffect, useRef } from "react";

export default function CKEditorReadOnly({ content, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!content || !containerRef.current) return;

    containerRef.current.innerHTML = content;

    if (window.MathJax?.Hub) {
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, containerRef.current]);
    }
  }, [content]);

  if (!content) return null;

  return (
    <div
      ref={containerRef}
      className={`ck-content ${className}`}
      style={{ lineHeight: 1.6 }}
    />
  );
}
