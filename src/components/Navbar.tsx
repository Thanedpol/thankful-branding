"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/providers/AppProvider";
import { ThemeToggle, LanguageSwitcher } from "@/components/Controls";

const LINKS = [
  { href: "/#about", key: "nav.about" },
  { href: "/#portfolio", key: "nav.portfolio" },
  { href: "/blog", key: "nav.blog" },
  { href: "/press-kit", key: "nav.pressKit" },
];

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const t = useT();
  const [email, setEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient">TT</span>
            <span className="text-ink/40">_</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
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
