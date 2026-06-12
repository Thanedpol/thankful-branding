"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/demo-data";

function AdminLoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not_admin" ? "This account is not an administrator." : null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Guard: without real Supabase env vars the auth fetch goes to a
    // placeholder host and fails with an opaque "Failed to fetch".
    if (!configured) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (then redeploy) before logging in."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message ?? "Login failed.";
      setError(
        /failed to fetch/i.test(msg)
          ? "Can't reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL is correct and the project isn't paused."
          : msg
      );
      setLoading(false);
      return;
    }

    // Verify admin role; a member must not get into the dashboard.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Access denied. Administrators only.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-4 py-3 font-mono text-sm text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-cyan/50 focus:shadow-glow-cyan";

  return (
    <div className="glass relative w-full max-w-md overflow-hidden p-8">
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/10 font-display font-bold text-cyan">
            ◈
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/70">
              Restricted
            </p>
            <h1 className="font-display text-lg font-bold">Admin Console</h1>
          </div>
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 font-mono text-[11px] leading-relaxed text-amber-300">
            ⚠ Supabase ยังไม่ถูกตั้งค่า — ต้องใส่ env vars (NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY) แล้ว redeploy ก่อนจึงจะ login ได้
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="admin@email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {error && <p className="font-mono text-xs text-red-400">⚠ {error}</p>}
          <button type="submit" disabled={loading} className="btn-neon w-full">
            {loading ? "Authenticating…" : "Authenticate →"}
          </button>
        </form>

        {/* No registration here by design — admin is seeded only. */}
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink/20">
          Single-operator system · no public signup
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
      <div className="absolute inset-0 bg-radial-fade" />
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
