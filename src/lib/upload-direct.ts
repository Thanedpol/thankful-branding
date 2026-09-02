/**
 * Upload a file straight from the browser to Supabase Storage, bypassing the
 * Vercel function (whose ~4.5 MB request-body limit can't carry a video).
 *
 * The server hands out a short-lived signed upload token (/api/admin-upload-url,
 * admin-gated); the bytes then go directly to Supabase over XHR, which — unlike
 * fetch — reports upload progress, so a large video shows a live percentage
 * instead of an indefinite spinner.
 *
 * Throws with a human-readable Thai message.
 */
/**
 * Supabase's per-file upload ceiling for this project (a plan-level setting —
 * it can't be raised from a bucket, only in the dashboard on a paid plan).
 * Verified empirically: 50 MB uploads, 55 MB is rejected with EntityTooLarge.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/** Why a file is too big + what to do about it — shown before and after upload.
 *  The advice differs by kind: a video can go to YouTube instead, a product
 *  file can only be split or compressed. */
export function tooLargeMessage(size: number, kind: "video" | "file" = "video") {
  const head = `${kind === "video" ? "วิดีโอ" : "ไฟล์"}ใหญ่เกินไป (${mb(size)}MB) — อัปโหลดได้สูงสุด 50MB`;
  return kind === "video"
    ? `${head}\n` +
        `• ทางที่ง่ายที่สุด: อัปคลิปขึ้น YouTube/Facebook แล้วใช้ปุ่ม “▶ ฝัง” วางลิงก์แทน (ไม่จำกัดขนาด เล่นลื่นกว่า)\n` +
        `• หรือบีบอัดคลิปให้เล็กลงก่อน (เช่น ลดเป็น 1080p หรือตัดให้สั้นลง) แล้วอัปใหม่`
    : `${head}\n` +
        `• บีบอัดเป็น .zip ก่อน หรือแยกเป็นหลายไฟล์\n` +
        `• ถ้าเป็นวิดีโอคอร์ส แนะนำฝากไว้บน YouTube (ไม่เป็นสาธารณะ) แล้วขายเป็นลิงก์แทน`;
}

/** Upload and return BOTH the object path and the public URL (null for a
 *  private bucket, which has no public URL — the caller stores the path and
 *  reads it back through a short-lived signed URL). */
export async function uploadDirectResult(
  file: File,
  bucket: string,
  onProgress?: (pct: number) => void
): Promise<{ path: string; publicUrl: string | null }> {
  // Fail fast — no point pushing 200 MB up the wire just to be rejected.
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(tooLargeMessage(file.size));

  const res = await fetch("/api/admin-upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bucket, filename: file.name }),
  });
  const info = await res.json().catch(() => ({}));
  if (!res.ok || !info.token) {
    throw new Error(
      res.status === 401
        ? "เซสชันหมดอายุ — กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง"
        : info.error || "ขอสิทธิ์อัปโหลดไม่สำเร็จ"
    );
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const url = `${base}/storage/v1/object/upload/sign/${bucket}/${info.path}?token=${info.token}`;

  // Storage's signed-upload endpoint takes the file as multipart (same shape
  // supabase-js sends from the browser).
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file, file.name);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("authorization", `Bearer ${anon}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      // Storage reports "too large" as HTTP 400 with statusCode 413 in the body,
      // so the raw status alone isn't enough to recognise it.
      const body = xhr.responseText ?? "";
      const tooLarge =
        xhr.status === 413 || /"413"|EntityTooLarge|Payload too large/i.test(body);
      reject(
        new Error(
          tooLarge
            ? tooLargeMessage(file.size)
            : `อัปโหลดไม่สำเร็จ (${xhr.status}) ${body.slice(0, 120)}`.trim()
        )
      );
    };
    xhr.onerror = () => reject(new Error("อัปโหลดไม่สำเร็จ — เชื่อมต่อไม่ได้ (เน็ตหลุด?)"));
    xhr.onabort = () => reject(new Error("ยกเลิกการอัปโหลด"));
    xhr.send(form);
  });

  return { path: info.path as string, publicUrl: (info.publicUrl ?? null) as string | null };
}

/** Public-bucket convenience wrapper — the shape every existing caller uses. */
export async function uploadDirect(
  file: File,
  bucket: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const { publicUrl } = await uploadDirectResult(file, bucket, onProgress);
  return publicUrl ?? "";
}
