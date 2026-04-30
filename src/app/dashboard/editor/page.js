"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useState } from "react";

const CKEditorComponent = dynamic(
  () => import("@/components/CKEditor5").then((mod) => mod.default),
  { ssr: false }
);

const MathJaxScript = dynamic(
  () => import("@/components/MathJaxScript").then((mod) => mod.default),
  { ssr: false }
);

export default function HomePage() {
  const [content, setContent] = useState("");

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">CKEditor 5 with MathJax</h2>
        </CardHeader>
        <CardContent>
          <MathJaxScript />

          <CKEditorComponent
            initialData={content}
            onChange={setContent}
            config={{ height: 200 }}
          />
        </CardContent>
        <CardHeader>
          <p className="text-bold text-gray-500">
            Preview:
          </p>
          <div
            className="p-4 border rounded bg-gray-50"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </CardHeader>
      </Card>
    </>
  );
}
