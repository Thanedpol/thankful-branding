import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import T from "@/components/T";
import JsonLd from "@/components/JsonLd";
import { blogPostingJsonLd } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  demoBlogPosts,
  demoBlogPreviews,
} from "@/lib/demo-data";
import type { BlogPost, BlogPreview } from "@/lib/types";

export const revalidate = 0;

async function getPreviewBySlug(slug: string): Promise<BlogPreview | null> {
  if (!isSupabaseConfigured()) {
    return demoBlogPreviews.find((p) => p.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_previews")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogPreview | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPreviewBySlug(slug);
  if (!p) return { title: "Post not found — Thank Thanedpol" };
  return {
    title: `${p.title} — Thank Thanedpol`,
    description: p.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: p.title,
      description: p.excerpt ?? undefined,
      type: "article",
      url: `/blog/${slug}`,
      images: p.cover_image_url ? [p.cover_image_url] : undefined,
    },
  };
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Demo fallback (no Supabase configured): public posts render fully,
  // the member-only post shows the locked gate.
  if (!isSupabaseConfigured()) {
    const demoPost = demoBlogPosts[slug];
    if (demoPost) return <PublishedPost post={demoPost} />;
    const demoPrev = demoBlogPreviews.find((p) => p.slug === slug);
    if (demoPrev) return <LockedPost preview={demoPrev} slug={slug} />;
    notFound();
  }

  const supabase = await createClient();

  await supabase.auth.getUser();

  // RLS returns the full row only if the post is public OR the user is logged in.
  const { data: full } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const post = full as BlogPost | null;

  // Locked: post exists but body withheld (member-only + not logged in).
  if (!post) {
    const { data: preview } = await supabase
      .from("blog_previews")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!preview) notFound();
    return <LockedPost preview={preview as BlogPreview} slug={slug} />;
  }

  return <PublishedPost post={post} />;
}

function PublishedPost({ post }: { post: BlogPost }) {
  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />
      <Navbar />
      <main className="min-h-screen pt-32">
        <article className="mx-auto max-w-3xl px-6 pb-24">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
          >
            <T k="blog.back" />
          </Link>

          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            {!post.is_public && (
              <span className="tag !border-purple/40 !text-purple"><T k="blog.members" /></span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            {post.title}
          </h1>
          {post.published_at && (
            <p className="mt-3 font-mono text-xs text-muted">
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {post.cover_image_url && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div
            className="prose-cyber mt-10"
            dangerouslySetInnerHTML={{ __html: post.body ?? "" }}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}

function LockedPost({ preview, slug }: { preview: BlogPreview; slug: string }) {
  return (
    <>
      <JsonLd data={blogPostingJsonLd(preview)} />
      <Navbar />
      <main className="min-h-screen pt-32">
        <article className="mx-auto max-w-3xl px-6 pb-24">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
          >
            <T k="blog.back" />
          </Link>

          <span className="mt-6 inline-block tag !border-purple/40 !text-purple">
            <T k="blog.locked.tag" />
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            {preview.title}
          </h1>

          {preview.cover_image_url && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={preview.cover_image_url}
                alt={preview.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          <p className="mt-10 text-lg leading-relaxed text-muted">
            {preview.excerpt}
          </p>

          {/* Lock gate */}
          <div className="glass relative mt-8 overflow-hidden p-10 text-center">
            <div className="absolute inset-0 bg-radial-fade" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-purple/40 bg-purple/10 text-2xl text-purple">
                ⬡
              </div>
              <h2 className="font-display text-xl font-bold">
                <T k="blog.locked.title" />
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                <T k="blog.locked.body" />
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/login?redirect=/blog/${slug}`}
                  className="btn-neon"
                >
                  <T k="blog.locked.login" />
                </Link>
                <Link
                  href={`/register?redirect=/blog/${slug}`}
                  className="btn-ghost"
                >
                  <T k="blog.locked.register" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
