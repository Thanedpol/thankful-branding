"use client";

import { useState } from "react";
import { useT } from "@/components/providers/AppProvider";

export const CVS = [
  { key: "cv.th", href: "/cv/cv-th.html" },
  { key: "cv.en", href: "/cv/cv-en.html" },
];

/** Desktop "View CV" dropdown — opens the Thai / English CV in a new tab. */
export default function CvMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-cyan"
      >
        {t("nav.cv")}
        <span className="text-[8px]">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 z-50 mt-3 w-44 -translate-x-1/2 overflow-hidden rounded-lg border border-line/10 bg-space-light/95 backdrop-blur-md">
            {CVS.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-mono text-xs text-muted transition-colors hover:bg-surface/[0.06] hover:text-cyan"
              >
                {t(c.key)}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
