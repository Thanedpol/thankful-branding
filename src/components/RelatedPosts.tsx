import BlogCard from "@/components/BlogCard";
import T from "@/components/T";
import type { BlogPreview } from "@/lib/types";

/**
 * "Related posts" grid shown at the foot of a blog article. The posts are
 * chosen by the page (most shared tags first) and rendered with the same
 * BlogCard used on the blog index, so they localize + show views like the rest.
 */
export default function RelatedPosts({ posts }: { posts: BlogPreview[] }) {
  if (!posts.length) return null;
  return (
    <section className="border-t border-line/[0.06]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">
          <T k="blog.related.eyebrow" />
        </p>
        <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">
          <T k="blog.related" />
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
