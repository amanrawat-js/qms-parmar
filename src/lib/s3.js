import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

/* -------------------------------------------------
   S3 Client Configuration (dummy credentials for now)
------------------------------------------------- */

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "ap-south-1",
  endpoint: process.env.VULTR_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "qms-images";

/* -------------------------------------------------
   Upload a base64 image to S3
------------------------------------------------- */

/**
 * Decodes a base64 string, uploads it to S3, and returns the public URL.
 *
 * @param {string} base64Data  - raw base64 string (no data-URI prefix)
 * @param {string} mimeType   - e.g. "image/png"
 * @param {string} key        - S3 object key (path inside the bucket)
 * @returns {Promise<string>} - the public S3 URL of the uploaded object
 */
export async function uploadBase64ImageToS3(base64Data, mimeType, key) {
  const buffer = Buffer.from(base64Data, "base64");
  // prepend folder name
  const finalKey = `qms-parmar-academy/${key}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: finalKey,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // return public URL
  return `https://${BUCKET}.del1.vultrobjects.com/${finalKey}`;
}

/* -------------------------------------------------
   Process HTML content — find <img> base64, upload, replace
------------------------------------------------- */

// Regex: matches <img ... src="data:image/TYPE;base64,DATA" ... />
// Captures the full <img> tag, the mime type, and the base64 payload.
const IMG_BASE64_REGEX =
  /<img\b[^>]*\bsrc\s*=\s*(?:"|\\"|&quot;|\\\\")data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=\s]+?)(?:"|\\"|&quot;|\\\\")[^>]*\/?>/gi;

/**
 * Scan an HTML string for `<img>` tags whose `src` is a base64 data-URI.
 * Upload each image to S3 and replace the src with the S3 URL.
 *
 * @param {string} html   - HTML string (may contain <img> tags)
 * @param {string} prefix - S3 key prefix, e.g. "questions/q123/en/"
 * @returns {Promise<string>} - HTML with base64 srcs replaced by S3 URLs
 */
export async function processHtmlImages(html, prefix = "") {
  if (!html || typeof html !== "string") return html;

  // Collect all matches first (regex is stateful with /g)
  const matches = [];
  let match;
  while ((match = IMG_BASE64_REGEX.exec(html)) !== null) {
    matches.push({
      fullMatch: match[0],
      mimeType: match[1],
      base64Data: match[2].replace(/\s/g, ""), // strip any whitespace in b64
    });
  }

  if (matches.length === 0) return html;

  // Upload each image and build replacement map
  let result = html;
  for (let i = 0; i < matches.length; i++) {
    const { fullMatch, mimeType, base64Data } = matches[i];

    // Determine file extension from mime type
    const ext = mimeType.split("/")[1] || "png";
    const uniqueId = crypto.randomUUID();
    const key = `${prefix}${uniqueId}.${ext}`;

    const s3Url = await uploadBase64ImageToS3(base64Data, mimeType, key);

    // Replace the base64 src with the S3 URL in the full <img> tag
    const newImgTag = fullMatch.replace(
      /src\s*=\s*(?:"|\\"|&quot;|\\\\")data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=\s]+?(?:"|\\"|&quot;|\\\\")/gi,
      `src="${s3Url}"`
    );

    result = result.replace(fullMatch, newImgTag);
  }

  return result;
}

/* -------------------------------------------------
   Process all content fields for a question
------------------------------------------------- */

/**
 * Walk through every language entry in a question's `content` map
 * and process all HTML fields (text, passage, solution, description,
 * and each option text) for embedded base64 images.
 *
 * @param {Object} contentMap - e.g. { en: { text, passage, solution, description, options }, hi: { ... } }
 * @param {string} questionId - unique identifier for S3 key prefixing
 * @returns {Promise<Object>} - the same content map with S3 URLs replacing base64 srcs
 */
export async function processContentImages(contentMap, questionId) {
  if (!contentMap || typeof contentMap !== "object") return contentMap;

  const processed = {};

  for (const [lang, data] of Object.entries(contentMap)) {
    if (!data) {
      processed[lang] = data;
      continue;
    }

    const prefix = `questions/${questionId}/${lang}/`;

    const entry = { ...data };

    // Process main text fields
    if (entry.text) entry.text = await processHtmlImages(entry.text, prefix);
    if (entry.passage) entry.passage = await processHtmlImages(entry.passage, prefix);
    if (entry.solution) entry.solution = await processHtmlImages(entry.solution, prefix);
    if (entry.description) entry.description = await processHtmlImages(entry.description, prefix);

    // Process option texts
    if (Array.isArray(entry.options)) {
      entry.options = await Promise.all(
        entry.options.map(async (opt) => {
          if (opt && opt.text) {
            return { ...opt, text: await processHtmlImages(opt.text, prefix) };
          }
          return opt;
        })
      );
    }

    processed[lang] = entry;
  }

  return processed;
}
