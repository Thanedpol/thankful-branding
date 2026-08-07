/**
 * Upload a file straight from the browser to Supabase Storage, bypassing the
 * Vercel function (whose ~4.5 MB request-body limit can't carry a video).
 *
 * The server hands out a short-lived signed upload token (/api/admin-upload-url,
 * admin-gated); the bytes then go directly to Supabase over XHR, which — unlike
 * fetch — reports upload progress, so a large video shows a live percentage
 * instead of an indefinite spinner.
 *
 * Returns the file's public URL. Throws with a human-readable Thai message.
 */
export async function uploadDirect(
  file: File,
  bucket: string,
  onProgress?: (pct: number) => void
): Promise<string> {
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
      const mb = (file.size / 1024 / 1024).toFixed(1);
      reject(
        new Error(
          xhr.status === 413
            ? `ไฟล์ใหญ่เกินที่ Supabase อนุญาต (${mb}MB) — กรุณาบีบอัดวิดีโอให้เล็กลงก่อน`
            : `อัปโหลดไม่สำเร็จ (${xhr.status}) ${xhr.responseText?.slice(0, 120) ?? ""}`.trim()
        )
      );
    };
    xhr.onerror = () => reject(new Error("อัปโหลดไม่สำเร็จ — เชื่อมต่อไม่ได้ (เน็ตหลุด?)"));
    xhr.onabort = () => reject(new Error("ยกเลิกการอัปโหลด"));
    xhr.send(form);
  });

  return info.publicUrl as string;
}
