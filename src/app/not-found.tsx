import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-cyan/70">
          signal lost
        </p>
        <h1
          className="glitch font-display text-7xl font-bold md:text-9xl"
          data-text="404"
        >
          404
        </h1>
        <p className="mt-4 text-muted">This sector of the grid does not exist.</p>
        <Link href="/" className="btn-neon mt-8">
          ← Return to base
        </Link>
      </div>
    </main>
  );
}
