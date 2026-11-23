"use client";

import { useState } from "react";
import { useT } from "@/components/providers/AppProvider";
import { HIRE_CONTACT_EMAIL } from "@/lib/hire";

/**
 * Email call-to-action that works for everyone.
 * A plain mailto: link does nothing on a computer with no mail app set up
 * (common on Windows when people use Gmail in the browser), so the main
 * button opens a Gmail draft in a new tab, a second button copies the
 * address, and the mailto: link stays as a small fallback for mail apps.
 */
export default function EmailActions({
  subject,
  body,
  label,
  className,
}: {
  subject: string;
  body?: string;
  /** Text of the main button; defaults to "write in Gmail". */
  label?: string;
  className?: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const to = HIRE_CONTACT_EMAIL;

  const gmail =
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    (body ? `&body=${encodeURIComponent(body)}` : "");
  const mailto =
    `mailto:${to}?subject=${encodeURIComponent(subject)}` + (body ? `&body=${encodeURIComponent(body)}` : "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(to);
    } catch {
      // Older browsers / blocked clipboard: select-and-copy via a temp field.
      const el = document.createElement("textarea");
      el.value = to;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <a href={gmail} target="_blank" rel="noopener noreferrer" className="btn-neon">
          {label ?? t("email.gmail")} ↗
        </a>
        <button type="button" onClick={copy} className="btn-ghost" aria-live="polite">
          {copied ? t("email.copied") : t("email.copy")}
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted">
        {to} ·{" "}
        <a href={mailto} className="underline decoration-line/30 underline-offset-2 hover:text-cyan">
          {t("email.app")}
        </a>
      </p>
    </div>
  );
}
