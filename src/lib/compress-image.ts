/**
 * Downscale + re-encode an image in the browser before upload, so it stays well
 * under the platform request-body limit (Vercel ~4.5MB) while staying visually
 * sharp. Runs only in the browser.
 *
 * - Caps the longest side at MAX_DIMENSION (crisp on retina, far smaller files).
 * - Steps quality down only as far as needed to reach TARGET_BYTES, floored so
 *   the result never looks mushy.
 * - Preserves transparency (PNG/WebP → WebP, which supports alpha); photos go to
 *   JPEG. GIF (animation) and SVG (vector) are never touched.
 * - Anything already small and within the size cap is returned untouched.
 * - On any failure it returns the original file, so upload still proceeds.
 */

const MAX_DIMENSION = 2560; // longest-side cap in px
const TARGET_BYTES = 4 * 1024 * 1024; // ~4MB, safely below Vercel's 4.5MB cap
const MIN_QUALITY = 0.6; // don't compress past this — keeps it sharp

export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  // Only raster photos; leave GIF (animation) and SVG (vector) alone.
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file; // undecodable → let the server handle the original
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
  const needsResize = scale < 1;
  const needsCompress = file.size > TARGET_BYTES;
  if (!needsResize && !needsCompress) return file; // already fine

  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  // WebP keeps alpha for PNG/WebP sources; JPEG for opaque photos.
  const keepsAlpha = file.type === "image/png" || file.type === "image/webp";
  const outType = keepsAlpha ? "image/webp" : "image/jpeg";

  let quality = 0.9;
  let blob = await toBlob(canvas, outType, quality);
  while (blob && blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await toBlob(canvas, outType, quality);
  }

  // Bail out if encoding failed or didn't actually shrink the file.
  if (!blob || blob.size >= file.size) return file;

  const ext = outType === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return new File([blob], name, {
    type: outType,
    lastModified: file.lastModified,
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
