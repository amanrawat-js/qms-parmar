import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/lib/s3";
import { requireRole } from "@/lib/auth-guard";

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with a file field named "upload" (CKEditor 4 convention).
 * Uploads the file to Vultr Object Storage and returns the public URL.
 *
 * Response format follows CKEditor 4's uploadimage plugin contract:
 *   { uploaded: 1, fileName: "...", url: "https://..." }
 */
export async function POST(req) {
  const { session, denied } = await requireRole(req, "POST", "/api/upload");
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get("upload"); // CKEditor 4 sends the file with field name "upload"

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

    // CKEditor 4 uploadimage plugin expects this exact response shape
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
