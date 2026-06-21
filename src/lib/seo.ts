import type { SiteProfile, BlogPost, BlogPreview } from "@/lib/types";

/** Canonical site URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thankful-branding.vercel.app"
).replace(/\/$/, "");

const NAME = "Thank Thanedpol";
const ROLE = "Content Creator — AI & Business · SCI & Technology";

export function personJsonLd(profile: SiteProfile | null) {
  const social = profile?.social_links;
  const sameAs = [social?.github, social?.linkedin, social?.x].filter(
    (u): u is string => !!u
  );
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name ?? NAME,
    url: SITE_URL,
    jobTitle: profile?.headline ?? ROLE,
    description: profile?.long_bio ?? undefined,
    image: profile?.avatar_url
      ? new URL(profile.avatar_url, SITE_URL).toString()
      : undefined,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${NAME} — Portfolio & Blog`,
    url: SITE_URL,
  };
}

export function blogPostingJsonLd(post: BlogPost | BlogPreview) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: post.tags?.join(", ") || undefined,
    author: { "@type": "Person", name: NAME, url: SITE_URL },
  };
}
