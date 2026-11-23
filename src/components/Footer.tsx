"use client";

import Link from "next/link";
import { useT } from "@/components/providers/AppProvider";
import type { SocialLinks } from "@/lib/types";
import { LINKEDIN_URL, GITHUB_URL, SOCIAL_PROFILES } from "@/lib/social";
import { YT_CHANNEL_URL } from "@/lib/youtube";
import Prism from "@/components/naqid/Prism";

// Known profiles, used when the profile row in the database leaves a field empty.
const profileUrl = (platform: string) => SOCIAL_PROFILES.find((p) => p.platform === platform)?.url;

const NAV = [
  { href: "/about", key: "nav.about" },
  { href: "/#portfolio", key: "nav.portfolio" },
  { href: "/blog", key: "nav.blog" },
  { href: "/sponsor", key: "footer.sponsor" },
  { href: "/press-kit", key: "nav.pressKit" },
  { href: "/#faq", key: "footer.faq" },
];

const LEGAL = [
  { href: "/privacy", key: "footer.privacy" },
  { href: "/terms", key: "footer.terms" },
];

export default function Footer({ social }: { social?: Partial<SocialLinks> }) {
  const t = useT();
  const socials = [
    { label: "YouTube", href: YT_CHANNEL_URL },
    { label: "TikTok", href: social?.tiktok || profileUrl("tiktok") },
    { label: "Instagram", href: profileUrl("instagram") },
    { label: "Facebook", href: social?.facebook || profileUrl("facebook") },
    { label: "X", href: social?.x },
    // Fall back to the known profiles, so pages rendered without the
    // profile row still link them (rel="me" ties them to this site).
    { label: "LinkedIn", href: social?.linkedin || LINKEDIN_URL },
    { label: "GitHub", href: social?.github || GITHUB_URL },
    { label: "Email", href: social?.email ? `mailto:${social.email}` : undefined },
  ]
    .filter((l): l is { label: string; href: string } => Boolean(l.href))
    // A profile URL with no path ("https://x.com/") is an unfilled placeholder
    // in the profile settings, not a profile — linking it sends people nowhere.
    .filter((l) => l.href.startsWith("mailto:") || /^https?:\/\/[^/]+\/[^/?#]+/.test(l.href));

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line/10 bg-space">
      {/* neon hairline + soft glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-cyan/[0.06] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              <span className="text-gradient">Thank Thanedpol</span>
              <span className="text-cyan">_</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {t("footer.blurb")}
            </p>
            {/* The founder's other brand, in its own colours (Bone + Void). */}
            <Link
              href="/naqid"
              className="group mt-6 inline-flex items-center gap-3 rounded-full border border-[#070B18]/15 bg-[#F5F2EA] py-2 pl-3 pr-5 text-[#070B18] transition-colors hover:bg-white"
            >
              <Prism size={22} />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium tracking-[0.18em]">NAQID GROUP</span>
                <span className="text-[11px] text-[#3F4B66]">{t("footer.naqid")}</span>
              </span>
              <span aria-hidden className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {t("footer.explore")}
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="footer-link">
                    <span className="footer-link-bar" />
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Follow */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {t("footer.follow")}
            </h3>
            {socials.length === 0 ? (
              <p className="mt-4 font-mono text-xs text-muted/60">—</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {socials.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer me"
                      className="footer-link"
                    >
                      <span className="footer-link-bar" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line/10 pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="font-mono text-xs text-muted">
              © {new Date().getFullYear()} Thank Thanedpol · {t("footer.rights")}
            </p>
            <nav aria-label="Legal" className="flex gap-4">
              {LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className="font-mono text-xs text-muted transition-colors hover:text-cyan">
                  {t(l.key)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-mono text-xs text-muted transition-colors hover:text-cyan"
            >
              {t("footer.top")}
            </button>
            <span className="text-muted/40">·</span>
            <Link
              href="/admin/login"
              className="font-mono text-[10px] uppercase tracking-widest text-ink/25 transition-colors hover:text-cyan"
            >
              ◈ system
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
