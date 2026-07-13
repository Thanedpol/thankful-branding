import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedFrames from "@/components/EmbedFrames";
import T from "@/components/T";
import JsonLd from "@/components/JsonLd";
import BlogViewTracker from "@/components/BlogViewTracker";
import RelatedPosts from "@/components/RelatedPosts";
import { LocalizedTitle, LocalizedExcerpt, LocalizedBody } from "@/components/BlogLocalized";
import { blogPostingJsonLd } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  demoBlogPosts,
  demoBlogPreviews,
  demoProfile,
} from "@/lib/demo-data";
import type { BlogPost, BlogPreview } from "@/lib/types";

export const revalidate = 0;

/** The blog is single-author — the byline is the site owner's name. */
async function getAuthorName(): Promise<string> {
  if (!isSupabaseConfigured()) return demoProfile.name;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_profile")
    .select("name")
    .eq("id", 1)
    .maybeSingle();
  return (data as { name?: string } | null)?.name || demoProfile.name;
}

// ─── Related-post ranking by content similarity (TF-IDF-lite) ────────────────
// Score other posts by shared meaningful terms across title + excerpt + tags,
// weighting rare/specific terms (e.g. "Gemini", "ByteDance", "Chef") far higher
// than common ones (e.g. "AI") so the results are actually on-topic — not just
// "shares the AI tag". Uses `blog_previews` (safe, published, no body).
const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "is", "are",
  "was", "it", "this", "that", "at", "by", "from", "as", "be", "how", "why", "what",
  "who", "your", "you", "we", "our", "its", "new",
  "และ", "ที่", "ของ", "ใน", "เป็น", "การ", "ให้", "กับ", "จาก", "มี", "ได้", "ก็", "แต่",
  "หรือ", "จะ", "ว่า", "แล้ว", "นี้", "ด้วย", "ไป", "มา", "คือ", "เพื่อ", "ทั้ง", "อย่าง",
  "ต่อ", "โดย", "ก่อน", "ขึ้น", "ทุก", "แบบ", "ยัง",
]);

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .split(/[^\p{L}\p{N}\p{M}]+/u) // keep Thai marks so Thai words stay intact
    .filter((t) => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

/** Weighted term map for a post: tags strongest, then title, then excerpt. */
function termWeights(p: BlogPreview): Map<string, number> {
  const m = new Map<string, number>();
  const add = (text: string, w: number) => {
    for (const t of tokenize(text)) m.set(t, Math.max(m.get(t) ?? 0, w));
  };
  (p.tags ?? []).forEach((tag) => add(tag, 3));
  add(p.title ?? "", 2);
  add(p.excerpt ?? "", 1);
  return m;
}

async function getRelatedPosts(slug: string): Promise<BlogPreview[]> {
  let all: BlogPreview[];
  if (!isSupabaseConfigured()) {
    all = demoBlogPreviews;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_previews")
      .select("*")
      .order("published_at", { ascending: false });
    all = (data as BlogPreview[]) ?? [];
  }

  const docs = all.map((p) => ({ p, terms: termWeights(p) }));
  const cur = docs.find((d) => d.p.slug === slug);
  const others = docs.filter((d) => d.p.slug !== slug);
  if (!cur) return others.slice(0, 3).map((d) => d.p);

  // Document frequency → idf: a term shared by few posts is more meaningful.
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.terms.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length;
  const idf = (t: string) => Math.log((N + 1) / ((df.get(t) ?? 0) + 1)) + 1;

  // idf-weighted vector per post; rank by COSINE similarity so a post doesn't
  // rank high just for being long (cosine normalizes vector length).
  const vecOf = (terms: Map<string, number>) => {
    const v = new Map<string, number>();
    let sq = 0;
    for (const [t, w] of terms) {
      const x = w * idf(t);
      v.set(t, x);
      sq += x * x;
    }
    return { v, norm: Math.sqrt(sq) || 1 };
  };

  const curVec = vecOf(cur.terms);
  const scored = others.map((d) => {
    const cand = vecOf(d.terms);
    let dot = 0;
    for (const [t, x] of curVec.v) {
      const y = cand.v.get(t);
      if (y) dot += x * y;
    }
    return { p: d.p, score: dot / (curVec.norm * cand.norm) };
  });

  // Only genuinely similar posts — no padding with unrelated recent posts.
  return scored
    .filter((s) => s.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.p);
}

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
      siteName: "Thank Thanedpol",
      locale: "th_TH",
      publishedTime: p.published_at ?? undefined,
      authors: ["Thank Thanedpol"],
      tags: p.tags,
      images: p.cover_image_url ? [p.cover_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.excerpt ?? undefined,
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
    if (demoPost) {
      const related = await getRelatedPosts(slug);
      return (
        <PublishedPost
          post={demoPost}
          memberBody={demoPost.member_body ?? null}
          authorName={demoProfile.name}
          related={related}
        />
      );
    }
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

  const authorName = await getAuthorName();
  const related = await getRelatedPosts(slug);
  return (
    <PublishedPost
      post={post}
      memberBody={memberBody}
      authorName={authorName}
      related={related}
    />
  );
}

function PublishedPost({
  post,
  memberBody = null,
  authorName,
  related = [],
}: {
  post: BlogPost;
  memberBody?: string | null;
  authorName: string;
  related?: BlogPreview[];
}) {
  const views = post.view_count ?? 0;
  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />
      <BlogViewTracker slug={post.slug} />
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

          <LocalizedTitle title={post.title} translations={post.translations} />
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-muted">
            <span className="text-ink/80">
              <T k="blog.by" /> {authorName}
            </span>
            {post.published_at && (
              <>
                <span className="text-line/30" aria-hidden>·</span>
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Bangkok",
                  })}{" "}
                  น.
                </time>
              </>
            )}
            <span className="text-line/30" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 text-cyan/90">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {views.toLocaleString()} <T k="blog.views" />
            </span>
          </div>

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

          <LocalizedBody body={post.body ?? ""} translations={post.translations} />

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

        <RelatedPosts posts={related} />
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
          <LocalizedTitle title={preview.title} translations={preview.translations} />

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

          <LocalizedExcerpt
            excerpt={preview.excerpt ?? ""}
            translations={preview.translations}
            className="mt-10 text-lg leading-relaxed text-muted"
          />

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
