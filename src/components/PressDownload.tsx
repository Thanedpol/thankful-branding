"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/providers/AppProvider";
import type { LogoFile } from "@/lib/types";

interface Props {
  kitPdfPath: string | null;
  logoFiles: LogoFile[];
}

/**
 * Renders the downloadable press assets. Clicking any asset checks for a
 * session first; if absent it surfaces a "Login required" gate instead of
 * downloading. Logged-in members/admins get a signed URL via the API route.
 */
export default function PressDownload({ kitPdfPath, logoFiles }: Props) {
  const supabase = createClient();
  const t = useT();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function download(path: string) {
    if (!authed) {
      setShowGate(true);
      return;
    }
    window.location.href = `/api/press-download?path=${encodeURIComponent(path)}`;
  }

  const assets: { label: string; path: string }[] = [
    ...(kitPdfPath ? [{ label: "Full Press Kit (PDF)", path: kitPdfPath }] : []),
    ...logoFiles.map((f) => ({ label: f.label, path: f.file_url })),
  ];

  return (
    <div>
      <h3 className="mb-4 font-display text-xl font-bold">{t("press.downloads")}</h3>

      {assets.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t("press.empty")}</p>
      ) : (
        <div className="space-y-3">
          {assets.map((a) => (
            <button
              key={a.path}
              onClick={() => download(a.path)}
              className="glass glass-hover flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-cyan">⬇</span>
                <span className="font-body">{a.label}</span>
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                {authed ? t("press.download") : t("press.loginRequired")}
              </span>
            </button>
          ))}
        </div>
      )}

      {showGate && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowGate(false)}
        >
          <div className="absolute inset-0 bg-space/80 backdrop-blur-sm" />
          <div
            className="glass relative z-10 w-full max-w-sm p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 text-2xl text-cyan">
              ⬡
            </div>
            <h4 className="font-display text-lg font-bold">{t("press.gateTitle")}</h4>
            <p className="mt-2 text-sm text-muted">{t("press.gateBody")}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login?redirect=/press-kit" className="btn-neon w-full">
                {t("press.loginBtn")}
              </Link>
              <Link
                href="/register?redirect=/press-kit"
                className="btn-ghost w-full"
              >
                {t("press.registerBtn")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
