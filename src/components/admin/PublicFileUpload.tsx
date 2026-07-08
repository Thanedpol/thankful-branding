"use client";

import { useRef, useState } from "react";

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

/**
 * Admin picker for a PUBLIC file (e.g. a CV/resume PDF). Paste a URL directly,
 * or upload a file to a public bucket via /api/admin-upload and get its public
 * URL. Submits the resulting URL under `name`. Unlike ImageUpload it doesn't
 * compress or assume an image, so PDFs/HTML/docs are fine.
 */
export default function PublicFileUpload({
  name,
  defaultValue = "",
  label,
  accept,
  hint,
  bucket = "avatars",
}: {
  name: string;
  defaultValue?: string;
  label: string;
  accept?: string;
  hint?: string;
  /** Public bucket to upload into. */
  bucket?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setErr(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.publicUrl) setErr(data.error || "อัปโหลดไม่สำเร็จ");
      else setUrl(data.publicUrl);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <input type="hidden" name={name} value={url} />

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="วางลิงก์ หรือกดอัปโหลด →"
          className={field}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-lg border border-cyan/40 bg-cyan/10 px-3 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
        >
          {busy ? "…" : "⬆ อัปโหลด"}
        </button>
        <input ref={fileRef} type="file" accept={accept} onChange={onFile} className="hidden" />
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block max-w-full truncate font-mono text-[10px] text-cyan/70 hover:text-cyan"
        >
          ↗ {url}
        </a>
      )}
      {hint && <p className="mt-1 font-mono text-[10px] text-muted">{hint}</p>}
      {err && <p className="mt-1 font-mono text-[10px] text-red-400">⚠ {err}</p>}
    </div>
  );
}
