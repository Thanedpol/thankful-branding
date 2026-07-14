import Navbar from "@/components/Navbar";

/** Skeleton for a blog article — mirrors the article + Latest News rail layout
 *  so navigating into a post shows the shape instantly while it renders. */
export default function ArticleLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <article className="mx-auto w-full min-w-0 max-w-3xl">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="mt-6 flex gap-2">
              <div className="skeleton h-5 w-16 rounded-md" />
              <div className="skeleton h-5 w-14 rounded-md" />
            </div>
            <div className="skeleton mt-4 h-9 w-full rounded-lg" />
            <div className="skeleton mt-2 h-9 w-2/3 rounded-lg" />
            <div className="skeleton mt-6 h-4 w-56 max-w-full rounded" />
            <div className="skeleton mt-8 aspect-video w-full rounded-2xl" />
            <div className="mt-10 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`skeleton h-4 rounded ${
                    i % 3 === 2 ? "w-1/2" : "w-full"
                  }`}
                />
              ))}
            </div>
          </article>

          {/* Latest News rail */}
          <div className="lg:pt-1">
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
      </main>
    </>
  );
}
