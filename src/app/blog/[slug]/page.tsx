import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedFrames from "@/components/EmbedFrames";
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
    if (demoPost)
      return <PublishedPost post={demoPost} memberBody={demoPost.member_body ?? null} />;
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

  // Members-only continuation (RLS returns it only for logged-in members;
  // anonymous visitors get null and see the gate). Tolerant pre-migration.
  let memberBody: string | null = null;
  if (post.has_member_content) {
    const { data: mc } = await supabase
      .from("blog_member_content")
      .select("member_body")
      .eq("post_id", post.id)
      .maybeSingle();
    memberBody = (mc as { member_body: string | null } | null)?.member_body ?? null;
  }

  return <PublishedPost post={post} memberBody={memberBody} />;
}

function PublishedPost({
  post,
  memberBody = null,
}: {
  post: BlogPost;
  memberBody?: string | null;
}) {
  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />
      <Navbar />
      <main className="min-h-screen pt-32">
        <article className="mx-auto max-w-3xl px-6 pb-24">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
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

          {post.has_member_content &&
            (memberBody ? (
              <section className="mt-12">
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-purple px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-white">
                    ⬡ <T k="blog.member.heading" />
                  </span>
                  <span className="h-px flex-1 bg-purple/25" />
                </div>
                <div
                  className="prose-cyber"
                  dangerouslySetInnerHTML={{ __html: memberBody }}
                />
              </section>
            ) : (
              <MemberGate slug={post.slug} />
            ))}
        </article>
      </main>
      <EmbedFrames />
      <Footer />
    </>
  );
}

/** Compact gate shown to non-members when a post has a members-only section. */
function MemberGate({ slug }: { slug: string }) {
  return (
    <div className="glass relative mt-12 overflow-hidden p-8 text-center">
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-purple/40 bg-purple/10 text-xl text-purple">
          ⬡
        </div>
        <h2 className="font-display text-lg font-bold">
          <T k="blog.member.gate.title" />
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          <T k="blog.member.gate.body" />
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/login?redirect=/blog/${slug}`} className="btn-neon">
            <T k="blog.locked.login" />
          </Link>
          <Link href={`/register?redirect=/blog/${slug}`} className="btn-ghost">
            <T k="blog.locked.register" />
          </Link>
        </div>
      </div>
    </div>
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
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
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
