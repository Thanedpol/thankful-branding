"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { LOCALES } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useApp();
  return (
    <button
      onClick={toggleTheme}
      aria-label={t("ui.theme")}
      title={t("ui.theme")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line/15 text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
    >
      {theme === "dark" ? (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useApp();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("ui.lang")}
        title={t("ui.lang")}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-line/15 px-2.5 font-mono text-xs text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        {current.short}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-32 overflow-hidden rounded-lg border border-line/10 bg-space-light/95 backdrop-blur-md">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-surface/[0.06] ${
                  l.code === locale ? "text-cyan" : "text-muted"
                }`}
              >
                {l.label}
                <span className="text-[10px] opacity-60">{l.short}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
