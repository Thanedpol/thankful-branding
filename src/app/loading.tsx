/**
 * Neutral root loading fallback — shown instantly on navigation to any route
 * that doesn't have its own loading.tsx, so a click never lands on a frozen
 * screen while the page renders. Blog routes provide layout-matching skeletons.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line/15 border-t-cyan" />
        <span className="text-gradient font-mono text-xs uppercase tracking-[0.3em]">
          Loading
        </span>
      </div>
    </div>
  );
}
