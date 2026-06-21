"use client";

import { useRef, useState } from "react";

interface Props {
  /** Form field name — submits the resulting public URL. */
  name: string;
  defaultValue?: string;
  /** Public Storage bucket to upload into (e.g. "portfolio-images"). */
  bucket: string;
  label: string;
}

/**
 * Admin image picker: uploads via /api/admin-upload (service-role, gated by
 * the admin passcode) and stores the resulting public URL in a hidden input.
 * A manual URL field remains as a fallback.
 */
export default function ImageUpload({ name, defaultValue = "", bucket, label }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);

    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Upload failed");
      } else {
        setUrl(data.publicUrl || "");
      }
    } catch {
      setErr("Upload failed");
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-line/10 bg-surface/5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink/30">
              no image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "⬆ Upload image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-1.5 font-mono text-[11px] text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50"
          />
          {err && <p className="font-mono text-[11px] text-red-400">⚠ {err}</p>}
        </div>
      </div>
    </div>
  );
}
