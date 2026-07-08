"use client";

import { useApp } from "@/components/providers/AppProvider";
import type { BlogTranslations } from "@/lib/types";

type Field = "title" | "excerpt" | "body";

/** Pick a translated field for the active locale, falling back to the source. */
function useLocalized(
  source: string,
  translations: BlogTranslations | undefined,
  field: Field
): string {
  const { locale } = useApp();
  if (locale === "th" || !translations) return source;
  const tr = translations[locale as "en" | "zh"];
  const value = tr?.[field];
  return value && value.trim() ? value : source;
}

/** Localized <h1> title for a blog post/preview. */
export function LocalizedTitle({
  title,
  translations,
  className = "mt-4 font-display text-4xl font-bold leading-tight md:text-5xl",
}: {
  title: string;
  translations?: BlogTranslations;
  className?: string;
}) {
  return <h1 className={className}>{useLocalized(title, translations, "title")}</h1>;
}

/** Localized excerpt paragraph (locked-post teaser). */
export function LocalizedExcerpt({
  excerpt,
  translations,
  className,
}: {
  excerpt: string;
  translations?: BlogTranslations;
  className?: string;
}) {
  return <p className={className}>{useLocalized(excerpt, translations, "excerpt")}</p>;
}

/** Localized rich-text body (HTML). */
export function LocalizedBody({
  body,
  translations,
  className = "prose-cyber mt-10",
}: {
  body: string;
  translations?: BlogTranslations;
  className?: string;
}) {
  const html = useLocalized(body, translations, "body");
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
