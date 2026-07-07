import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";

export const revalidate = 0;

async function count(table: string, filter?: (q: any) => any) {
  const supabase = createAdminClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function DashboardOverview() {
  let portfolioCount = 0;
  let blogCount = 0;
  let unread = 0;
  let totalViews = 0;
  let recent: { data: any[] | null } = { data: [] };

  // Skip all DB calls in demo mode — otherwise every tab switch waits on a
  // failing request to Supabase (placeholder key), which makes the admin lag.
  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    let totalsRows: { data: { total?: number }[] | null } = { data: null };
    [portfolioCount, blogCount, unread, recent, totalsRows] = await Promise.all([
      count("portfolio"),
      count("blog_posts"),
      count("contact_messages", (q) => q.eq("is_read", false)),
      supabase
        .from("contact_messages")
        .select("id, sender_name, subject, received_at, is_read")
        .order("received_at", { ascending: false })
        .limit(5),
      // Tolerant of the analytics migration not being run yet → 0.
      supabase.rpc("blog_view_totals") as unknown as Promise<{ data: { total?: number }[] | null }>,
    ]);
    totalViews = totalsRows.data?.[0]?.total ?? 0;
  }

  const stats = [
    { label: "Blog views", value: totalViews, href: "/admin/analytics", icon: "▤" },
    { label: "Portfolio items", value: portfolioCount, href: "/admin/portfolio", icon: "▦" },
    { label: "Blog posts", value: blogCount, href: "/admin/blog", icon: "✎" },
    { label: "Unread messages", value: unread, href: "/admin/messages", icon: "✉" },
  ];

  return (
    <div>
      <p className="eyebrow">// Dashboard</p>
      <h1 className="mb-8 font-display text-3xl font-bold">Overview</h1>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass glass-hover p-6">
            <div className="flex items-start justify-between">
              <span className="text-2xl text-cyan/60">{s.icon}</span>
              <span className="font-display text-4xl font-bold text-gradient">
                {s.value.toLocaleString()}
              </span>
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent messages</h2>
          <Link
            href="/admin/messages"
            className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
          >
            View all →
          </Link>
        </div>
        <div className="glass divide-y divide-line/[0.06]">
          {(recent.data ?? []).length === 0 ? (
            <p className="p-6 font-mono text-sm text-muted">No messages yet.</p>
          ) : (
            recent.data!.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-body">
                    {!m.is_read && <span className="mr-2 text-cyan">●</span>}
                    {m.sender_name}
                    <span className="ml-2 text-muted">— {m.subject || "(no subject)"}</span>
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-ink/40">
                  {new Date(m.received_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/admin/portfolio" className="btn-neon">
          + New Portfolio
        </Link>
        <Link href="/admin/blog" className="btn-ghost">
          + New Post
        </Link>
      </div>
    </div>
  );
}
