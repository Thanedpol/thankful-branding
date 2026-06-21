"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";

  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
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

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            required
            autoFocus
            placeholder="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className={field}
          />
          {error && <p className="font-mono text-xs text-red-400">⚠ {error}</p>}
          <button type="submit" disabled={loading} className="btn-neon w-full">
            {loading ? "Unlocking…" : "Unlock →"}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink/20">
          Single-operator system · passcode access
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
