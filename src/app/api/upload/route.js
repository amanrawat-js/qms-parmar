import { NextResponse } from "next/server";
import { getPresignedUploadUrl, uploadFileToS3 } from "@/lib/s3";
import { requireRole } from "@/lib/auth-guard";

/**
 * POST /api/upload
 *
 * Two modes of operation:
 *
 * MODE 1 — Presigned URL (preferred, used by the CKEditor5 component)
 *   Request:  Content-Type: application/json
 *             Body: { "fileName": "photo.jpg", "contentType": "image/jpeg" }
 *   Response: { "uploadUrl": "https://...signed...", "publicUrl": "https://...public..." }
 *   The client then PUTs the file directly to `uploadUrl`.
 *
 * MODE 2 — Legacy multipart upload (fallback, kept for backward compatibility)
 *   Request:  Content-Type: multipart/form-data  (field name: "upload")
 *   Response: CKEditor 5 custom upload adapter contract:
 *             { "uploaded": 1, "fileName": "...", "url": "https://..." }
 */
export async function POST(req) {
  const { session, denied } = await requireRole(req, "POST", "/api/upload");
  if (denied) return denied;

  try {
    const contentType = req.headers.get("content-type") || "";

    // ─── MODE 1: Presigned URL request (JSON body) ───
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { fileName, contentType: fileType } = body;

      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: "fileName and contentType are required" },
          { status: 400 }
        );
      }

      const result = await getPresignedUploadUrl(fileName, fileType);

      return NextResponse.json({
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
      });
    }

    // ─── MODE 2: Legacy multipart form upload ───
    const formData = await req.formData();
    const file = formData.get("upload"); // CKEditor upload convention

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { uploaded: 0, error: { message: "No file provided" } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";
    const originalName = file.name || "image.png";

    const url = await uploadFileToS3(buffer, mimeType, originalName);

    // CKEditor 5 custom upload adapter expects this response shape
    return NextResponse.json({
      uploaded: 1,
      fileName: originalName,
      url,
    });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);

    return NextResponse.json(
      {
        uploaded: 0,
        error: { message: error.message || "Upload failed" },
      },
      { status: 400 }
    );
  }
}

/**
 * Increase Next.js body size limit for the legacy multipart fallback.
 * Presigned URL mode sends only a tiny JSON body, so this only matters
 * for the multipart path.
 *
 * NOTE: Body size for App Router routes is configured via
 * `experimental.serverBodySizeLimit` in next.config.mjs — not here.
 */
