"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import BlogCard from "./BlogCard";
import { useT } from "@/components/providers/AppProvider";
import type { BlogPreview as BlogPreviewType } from "@/lib/types";

export default function BlogPreview({ posts }: { posts: BlogPreviewType[] }) {
  const t = useT();
  return (
    <section id="blog" className="section-pad scroll-mt-20">
      <Reveal>
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="eyebrow">{t("blog.eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold md:text-4xl text-gradient">
              {t("blog.heading")}
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan sm:block"
          >
            {t("blog.all")}
          </Link>
        </div>
      </Reveal>

      {posts.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t("blog.empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 80}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
