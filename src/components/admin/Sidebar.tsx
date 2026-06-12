"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Overview", icon: "◇" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "▦" },
  { href: "/admin/blog", label: "Blog", icon: "✎" },
  { href: "/admin/press-kit", label: "Press Kit", icon: "⬡" },
  { href: "/admin/profile", label: "Profile", icon: "◉" },
  { href: "/admin/messages", label: "Messages", icon: "✉" },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-line/[0.06] bg-space-light/50 p-5 backdrop-blur-md">
      <Link href="/admin" className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/10 font-display font-bold text-cyan">
          ◈
        </span>
        <span className="font-display text-sm font-bold">
          Control<span className="text-gradient">Deck</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-sm transition-colors ${
                active
                  ? "border border-cyan/30 bg-cyan/10 text-cyan"
                  : "text-muted hover:bg-surface/[0.04] hover:text-ink"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line/[0.06] pt-4">
        <Link
          href="/"
          target="_blank"
          className="block font-mono text-[11px] uppercase tracking-wider text-muted hover:text-cyan"
        >
          ↗ View live site
        </Link>
        <p className="truncate font-mono text-[11px] text-ink/40">{email}</p>
        <button
          onClick={signOut}
          className="w-full rounded-lg border border-line/10 py-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
