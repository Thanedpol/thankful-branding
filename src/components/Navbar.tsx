"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/press-kit", label: "Press Kit" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.06] bg-space/80 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient">TT</span>
            <span className="text-white/40">_</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-cyan"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {email ? (
            <>
              <span className="font-mono text-xs text-cyan/70">{email}</span>
              <button onClick={signOut} className="btn-ghost !px-4 !py-2 text-xs">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-neon !px-4 !py-2 text-xs">
              Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-cyan md:hidden"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-space/95 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-mono text-sm uppercase tracking-wider text-muted hover:text-cyan"
              >
                {l.label}
              </Link>
            ))}
            {email ? (
              <button onClick={signOut} className="btn-ghost mt-2 text-xs">
                Logout
              </button>
            ) : (
              <Link href="/login" className="btn-neon mt-2 text-xs">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
