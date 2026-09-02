"use client";

import { useRef, useState } from "react";
import { uploadDirectResult, MAX_UPLOAD_BYTES, tooLargeMessage } from "@/lib/upload-direct";

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

/**
 * Picker for a file that must NOT be publicly reachable — the deliverable a
 * buyer gets after paying. It submits the storage object PATH, not a URL:
 * the bucket has no public read policy, so the only way to the bytes is a
 * short-lived signed URL minted server-side once an order is verified.
 *
 * Uploads go straight to Supabase (signed token from /api/admin-upload-url),
 * so an ebook or a zip isn't capped by Vercel's ~4.5 MB request-body limit.
 */
export default function PrivateFileUpload({
  name,
  defaultValue = "",
  label,
  accept,
  hint,
  bucket,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  accept?: string;
  hint?: string;
  bucket: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(defaultValue);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setErr(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setErr(tooLargeMessage(file.size, "file"));
      return;
    }

    setPct(0);
    try {
      const { path: uploaded } = await uploadDirectResult(file, bucket, setPct);
      setPath(uploaded);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setPct(null);
    }
  }

  const busy = pct !== null;

  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>

      <input type="hidden" name={name} value={path} />

      <div className="flex gap-2">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="ยังไม่ได้เลือกไฟล์"
          className={`${field} font-mono text-xs`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-ghost shrink-0 whitespace-nowrap !px-4 !py-2 text-xs disabled:opacity-50"
        >
          {busy ? `${pct}%` : path ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}
        </button>
        {path && !busy && (
          <button
            type="button"
            onClick={() => setPath("")}
            className="shrink-0 font-mono text-xs text-red-400/70 hover:text-red-400"
          >
            ลบ
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept={accept} onChange={onFile} className="hidden" />

      {busy && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface/10">
          <div className="h-full bg-cyan transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      )}

      {err && (
        <p className="mt-2 whitespace-pre-line font-mono text-[11px] leading-relaxed text-red-400">
          {err}
        </p>
      )}

      {!err && (
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-muted">
          {hint ?? "ไฟล์นี้ไม่เปิดสาธารณะ — ลูกค้าจะได้ลิงก์ดาวน์โหลดชั่วคราวหลังชำระเงินเท่านั้น"}
        </p>
      )}
    </label>
  );
}
