import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/* -------------------------------------------------
   S3 Client — Vultr Object Storage
------------------------------------------------- */

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "del1",
  endpoint: process.env.VULTR_ENDPOINT || "https://del1.vultrobjects.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = (process.env.AWS_S3_BUCKET || "qms-images").replace(/\/+$/, "");
const FOLDER_PREFIX = process.env.S3_FOLDER_PREFIX || "qms-parmar-academy";
const PUBLIC_URL_BASE = process.env.VULTR_URL || `https://${BUCKET}.del1.vultrobjects.com`;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* -------------------------------------------------
   Helpers
------------------------------------------------- */

function extFromMime(mimeType) {
  if (!mimeType) return "png";
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
  };
  return map[mimeType.toLowerCase()] || "png";
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split(".");
    if (parts.length > 1) {
      const ext = parts.pop().split("?")[0].toLowerCase();
      if (ext && ext.length <= 5) return ext;
    }
  } catch {
    // ignore
  }
  return "png";
}

function buildKey(prefix, ext) {
  return `${FOLDER_PREFIX}/${prefix}${crypto.randomUUID()}.${ext}`;
}

async function uploadBuffer(buffer, mimeType, key) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Invalid image buffer");
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)} MB limit`);
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);
  return `${PUBLIC_URL_BASE}/${key}`;
}

/* -------------------------------------------------
   HTML tag cleaning
------------------------------------------------- */

const UNWANTED_TAGS = ["td", "tr", "table", "tbody", "thead", "tfoot", "colgroup", "col"];

function cleanUnwantedTags(html) {
  if (!html || typeof html !== "string") return html;

  let result = html;

  for (const tag of UNWANTED_TAGS) {
    const openRe = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "gi");
    const closeRe = new RegExp(`</${tag}>`, "gi");
    result = result.replace(openRe, "").replace(closeRe, "");
  }

  return result;
}

/* -------------------------------------------------
   Parse <img> tags with an HTML-aware approach
   Preserves all attributes except src.
------------------------------------------------- */

function parseImgAttributes(imgTag) {
  const attrs = {};
  const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m;
  while ((m = attrRegex.exec(imgTag)) !== null) {
    const name = m[1].toLowerCase();
    attrs[name] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
  }
  return attrs;
}

function rebuildImgTag(attrs, selfClose) {
  const parts = ["<img"];
  const order = ["src", "alt", "class", "style", "width", "height", "name", "align", "role", "data-mathml"];
  const ordered = new Set(order);

  for (const key of order) {
    if (attrs[key] !== undefined) {
      parts.push(`${key}="${attrs[key]}"`);
    }
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (!ordered.has(key)) {
      parts.push(`${key}="${value}"`);
    }
  }

  if (selfClose) {
    parts.push("/>");
  } else {
    parts.push(">");
  }

  return parts.join(" ");
}

/* -------------------------------------------------
   Process a single HTML string
------------------------------------------------- */

const IMG_TAG_REGEX = /<img\b[^>]*>/gi;
const BASE64_SRC_REGEX = /^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/i;
const HTTP_SRC_REGEX = /^https?:\/\/.+/i;

async function processHtml(html, prefix) {
  if (!html || typeof html !== "string") {
    return { html, uploadedUrls: [], failed: 0 };
  }

  const imgMatches = [];
  let match;
  const regex = new RegExp(IMG_TAG_REGEX.source, IMG_TAG_REGEX.flags);

  while ((match = regex.exec(html)) !== null) {
    imgMatches.push({ fullTag: match[0], index: match.index });
  }

  if (imgMatches.length === 0) {
    return { html, uploadedUrls: [], failed: 0 };
  }

  let result = html;
  const uploadedUrls = [];
  let failed = 0;

  for (const imgMatch of imgMatches) {
    const attrs = parseImgAttributes(imgMatch.fullTag);
    const src = attrs.src;

    if (!src) continue;

    let newSrc = null;

    try {
      // CASE A — base64 data URI
      const b64Match = src.match(BASE64_SRC_REGEX);
      if (b64Match) {
        const mimeType = b64Match[1];
        const base64Data = b64Match[2].replace(/\s/g, "");

        if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
          throw new Error(`Unsupported MIME type: ${mimeType}`);
        }

        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length === 0) throw new Error("Empty base64 image");
        if (buffer.length > MAX_IMAGE_SIZE) throw new Error("Image too large");

        const ext = extFromMime(mimeType);
        const key = buildKey(prefix, ext);
        newSrc = await uploadBuffer(buffer, mimeType, key);
      }

      // CASE B — external HTTP(S) URL
      if (!newSrc && HTTP_SRC_REGEX.test(src)) {
        const response = await fetch(src, { method: "GET" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length === 0) throw new Error("Empty remote image");
        if (buffer.length > MAX_IMAGE_SIZE) throw new Error("Image too large");

        let mimeType = (response.headers.get("content-type") || "image/png").split(";")[0].trim().toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          mimeType = "image/png";
        }

        const ext = extFromMime(mimeType) || extFromUrl(src);
        const key = buildKey(prefix, ext);
        newSrc = await uploadBuffer(buffer, mimeType, key);
      }

      if (newSrc) {
        attrs.src = newSrc;
        const selfClose = imgMatch.fullTag.endsWith("/>");
        const newImgTag = rebuildImgTag(attrs, selfClose);
        result = result.replace(imgMatch.fullTag, newImgTag);
        uploadedUrls.push(newSrc);
      }
    } catch (err) {
      console.error(`Image upload failed: ${src.substring(0, 80)}...`, err.message);
      failed++;
    }
  }

  result = cleanUnwantedTags(result);

  return { html: result, uploadedUrls, failed };
}

/* -------------------------------------------------
   Process all content fields of a question
------------------------------------------------- */

async function processContentImages(contentMap, questionId) {
  if (!contentMap || typeof contentMap !== "object") {
    return { contentMap, uploadedUrls: [], failed: 0 };
  }

  const processed = {};
  const allUploadedUrls = [];
  let totalFailed = 0;

  for (const [lang, data] of Object.entries(contentMap)) {
    if (!data) {
      processed[lang] = data;
      continue;
    }

    const prefix = `questions/${questionId}/${lang}/`;
    const entry = { ...data };

    const textFields = ["text", "passage", "solution", "description"];
    for (const field of textFields) {
      if (entry[field]) {
        const res = await processHtml(entry[field], prefix);
        entry[field] = res.html;
        allUploadedUrls.push(...res.uploadedUrls);
        totalFailed += res.failed;
      }
    }

    if (Array.isArray(entry.options)) {
      const optResults = await Promise.all(
        entry.options.map(async (opt) => {
          if (opt && opt.text) {
            const res = await processHtml(opt.text, prefix);
            allUploadedUrls.push(...res.uploadedUrls);
            totalFailed += res.failed;
            return { ...opt, text: res.html };
          }
          return opt;
        })
      );
      entry.options = optResults;
    }

    processed[lang] = entry;
  }

  return { contentMap: processed, uploadedUrls: allUploadedUrls, failed: totalFailed };
}

/* -------------------------------------------------
   Delete image from S3 (rollback / cleanup)
------------------------------------------------- */

async function deleteImageFromS3(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.replace(/^\//, "");

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error(`Failed to delete "${url}":`, err.message);
    return false;
  }
}

/* -------------------------------------------------
   Direct file upload (for CKEditor inline uploads)
------------------------------------------------- */

async function uploadFileToS3(buffer, mimeType, originalName = "") {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Invalid file buffer");
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`File exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)} MB limit`);
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const ext = extFromMime(mimeType);
  const key = buildKey("editor-uploads/", ext);
  return uploadBuffer(buffer, mimeType, key);
}

/* -------------------------------------------------
   Generate a presigned PUT URL for direct browser upload
   Returns { uploadUrl, publicUrl, key }
------------------------------------------------- */

async function getPresignedUploadUrl(fileName, contentType) {
  if (!contentType || !ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  const ext = extFromMime(contentType);
  const key = buildKey("editor-uploads/", ext);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  const publicUrl = `${PUBLIC_URL_BASE}/${key}`;

  return { uploadUrl, publicUrl, key };
}

/* -------------------------------------------------
   Exports
------------------------------------------------- */

export { processContentImages, processHtml, deleteImageFromS3, uploadFileToS3, getPresignedUploadUrl };
