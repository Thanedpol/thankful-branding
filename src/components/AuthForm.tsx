"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/demo-data";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured yet. Set the NEXT_PUBLIC_SUPABASE_URL / ANON_KEY env vars and redeploy."
      );
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === "register") {
      // Self-registration → always a 'member' (enforced by DB trigger + RLS).
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        // If email confirmation is on, session is null until confirmed.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.push(redirect);
          router.refresh();
        } else {
          setNotice("Check your inbox to confirm your email, then log in.");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    }
    setLoading(false);
  }

  const field =
    "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-4 py-3 font-body text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-cyan/50 focus:shadow-glow-cyan";

  return (
    <div className="glass relative w-full max-w-md overflow-hidden p-8">
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative">
        <p className="eyebrow">
          {mode === "login" ? "// Access" : "// New node"}
        </p>
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Become a member"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "login"
            ? "Sign in to read exclusive posts and download press assets."
            : "Free membership · unlock member-only writing & press downloads."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />

          {error && (
            <p className="font-mono text-xs text-red-400">⚠ {error}</p>
          )}
          {notice && (
            <p className="font-mono text-xs text-cyan">◉ {notice}</p>
          )}

          <button type="submit" disabled={loading} className="btn-neon w-full">
            {loading
              ? "…"
              : mode === "login"
                ? "Login →"
                : "Create account →"}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-xs text-muted">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link
                href={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-cyan hover:underline"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              Already a member?{" "}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-cyan hover:underline"
              >
                Login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
