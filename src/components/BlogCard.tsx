"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp, useT } from "@/components/providers/AppProvider";
import type { BlogPreview } from "@/lib/types";

export default function BlogCard({ post }: { post: BlogPreview }) {
  const t = useT();
  const { locale } = useApp();
  const tr = locale !== "th" ? post.translations?.[locale as "en" | "zh"] : undefined;
  const title = tr?.title?.trim() ? tr.title : post.title;
  const excerpt = tr?.excerpt?.trim() ? tr.excerpt : post.excerpt;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass glass-hover group flex h-full flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-grid-faint bg-grid" />
        )}
        {!post.is_public && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-purple/40 bg-purple/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-purple">
            {t("blog.members")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="line-clamp-2 min-h-[3.25rem] font-display text-lg font-bold leading-snug transition-colors group-hover:text-cyan">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
          {excerpt}
        </p>
        <span className="mt-auto pt-4 font-mono text-xs uppercase tracking-wider text-cyan">
          {t("blog.read")}
        </span>
      </div>
    </Link>
  );
}
