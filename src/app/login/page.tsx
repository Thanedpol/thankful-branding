import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Login — Thank Thanedpol" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
      <div className="absolute inset-0 bg-radial-fade" />
      <Link
        href="/"
        className="absolute left-6 top-6 font-mono text-xs uppercase tracking-wider text-muted hover:text-cyan"
      >
        ← Home
      </Link>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
