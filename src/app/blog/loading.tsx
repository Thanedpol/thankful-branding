import Navbar from "@/components/Navbar";

/** Skeleton for the blog index — mirrors the two-column grid + Latest News rail
 *  so the layout stays put while posts load (no flash, no frozen click). */
export default function BlogLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !py-0">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton mt-4 h-10 w-64 max-w-full rounded-lg" />
          <div className="skeleton mt-4 h-4 w-96 max-w-full rounded" />

          <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
            {/* Card grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass overflow-hidden">
                  <div className="skeleton aspect-[16/9] w-full" />
                  <div className="space-y-3 p-5">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-5 w-4/5 rounded" />
                    <div className="skeleton h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Latest News rail */}
            <div className="mt-12 lg:mt-10">
              <div className="glass overflow-hidden p-5">
                <div className="skeleton mb-5 h-4 w-32 rounded" />
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
