import Link from "next/link";
import type { SocialLinks } from "@/lib/types";

export default function Footer({ social }: { social?: Partial<SocialLinks> }) {
  const links = [
    { label: "GitHub", href: social?.github },
    { label: "LinkedIn", href: social?.linkedin },
    { label: "X", href: social?.x },
    { label: "Email", href: social?.email ? `mailto:${social.email}` : undefined },
  ].filter((l) => l.href);

  return (
    <footer className="border-t border-white/[0.06] bg-space">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        <div className="font-display text-sm text-muted">
          <span className="text-gradient font-bold">Thank Thanedpol</span>
          <span className="mx-2 text-white/20">//</span>
          <span className="font-mono text-xs">AI from the future</span>
        </div>

        <div className="flex items-center gap-5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-cyan"
            >
              {l.label}
            </a>
          ))}
        </div>

        <p className="font-mono text-xs text-white/30">
          © {new Date().getFullYear()} · v1.0
        </p>
      </div>
      <div className="border-t border-white/[0.04] py-3 text-center">
        <Link
          href="/admin/login"
          className="font-mono text-[10px] uppercase tracking-widest text-white/15 transition-colors hover:text-white/40"
        >
          ◈ system
        </Link>
      </div>
    </footer>
  );
}
