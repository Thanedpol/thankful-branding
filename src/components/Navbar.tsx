"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProvider";
import { YT_SUBSCRIBE_URL } from "@/lib/youtube";
import { ThemeToggle, LanguageSwitcher } from "@/components/Controls";

const ALL_LINKS = [
  { href: "/#youtube", key: "nav.youtube" },
  { href: "/#about", key: "nav.about" },
  { href: "/#portfolio", key: "nav.portfolio" },
  { href: "/blog", key: "nav.blog" },
  { href: "/shop", key: "nav.shop" },
  { href: "/press-kit", key: "nav.pressKit" },
];

function SubscribeButton({ className = "", label }: { className?: string; label: string }) {
  return (
    <a
      href={YT_SUBSCRIBE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#ff0033] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] transition-transform hover:scale-[1.04] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
      </svg>
      {label}
    </a>
  );
}

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const { t, hasShop } = useApp();
  // An empty shop is a dead end — the item appears once something is for sale.
  const LINKS = ALL_LINKS.filter((l) => l.href !== "/shop" || hasShop);
  const [email, setEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    router.refresh();
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-space-light transition-shadow duration-300 ${
        scrolled
          ? "border-line/10 shadow-lg shadow-black/30"
          : "border-line/[0.06]"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Round brand mark. If the file is missing the wordmark stands alone
              rather than rendering a broken image. */}
          {logoOk && (
            <Image
              src="/thankful-logo.png"
              alt="Thankful"
              width={36}
              height={36}
              priority
              onError={() => setLogoOk(false)}
              className="h-9 w-9 shrink-0 rounded-full ring-1 ring-line/15 transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <span className="font-display text-lg font-bold tracking-tight text-gradient">
            Thankful
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-cyan"
            >
              {t(l.key)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <SubscribeButton label={t("yt.subscribe")} className="hidden lg:inline-flex" />
          <LanguageSwitcher />
          <ThemeToggle />
          {email ? (
            <button onClick={signOut} className="btn-ghost !px-4 !py-2 text-xs">
              {t("nav.logout")}
            </button>
          ) : (
            <Link href="/login" className="btn-neon !px-4 !py-2 text-xs">
              {t("nav.login")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-cyan"
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line/[0.06] bg-space-light px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <SubscribeButton label={t("yt.subscribe")} className="self-start" />
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-mono text-sm uppercase tracking-wider text-muted hover:text-cyan"
              >
                {t(l.key)}
              </Link>
            ))}
            {email ? (
              <button onClick={signOut} className="btn-ghost mt-2 text-xs">
                {t("nav.logout")}
              </button>
            ) : (
              <Link href="/login" className="btn-neon mt-2 text-xs">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
