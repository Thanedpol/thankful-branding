"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Form field name — submits the resulting object PATH (not a public URL). */
  name: string;
  defaultValue?: string;
  /** Private Storage bucket (e.g. "press-assets"). */
  bucket: string;
  label: string;
  accept?: string;
}

/**
 * Admin file picker for PRIVATE assets (press kit). Uploads to a private bucket
 * and stores the object PATH — downloads are later signed for logged-in users
 * via /api/press-download. A manual path field remains as a fallback.
 */
export default function FileUpload({
  name,
  defaultValue = "",
  bucket,
  label,
  accept,
}: Props) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${crypto.randomUUID()}-${safe}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    setPath(objectPath);
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <input type="hidden" name={name} value={path} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-lg border border-purple/40 bg-purple/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-purple transition-colors hover:bg-purple/20 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "⬆ Upload file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onFile}
          className="hidden"
        />
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="object path in bucket"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-white placeholder:text-white/30 outline-none focus:border-cyan/50"
        />
      </div>
      {err && <p className="mt-1 font-mono text-[11px] text-red-400">⚠ {err}</p>}
    </div>
  );
}
