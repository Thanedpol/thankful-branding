import Anthropic from "@anthropic-ai/sdk";

/**
 * AI translation of blog fields via Claude (server-only). Source is Thai;
 * targets are English and Simplified Chinese. Translations aim for a friendly,
 * natural, easy-to-understand register with correct domain terminology — not a
 * stiff literal rendering. HTML in `body` is preserved tag-for-tag.
 */

export type TranslateLocale = "en" | "zh";

export interface TranslatableFields {
  title: string;
  excerpt: string;
  body: string; // HTML
}

const LANG: Record<TranslateLocale, string> = {
  en: "English",
  zh: "Simplified Chinese (简体中文)",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    excerpt: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "excerpt", "body"],
} as const;

/** Whether an Anthropic key is configured (translation is a no-op without it). */
export function isTranslationConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function systemPrompt(locale: TranslateLocale): string {
  const zhRule =
    locale === "zh"
      ? "Write in SIMPLIFIED Chinese only (简体字). Never use Traditional Chinese characters (繁體字). "
      : "";
  return `You are a professional Thai→${LANG[locale]} translator for a technology, AI, and business news blog.

Rules:
- Translate the Thai source into ${LANG[locale]}. ${zhRule}
- Tone: friendly, natural, and easy to understand — like a knowledgeable creator explaining to readers. Do NOT translate stiffly or word-for-word; make it read naturally in ${LANG[locale]}.
- Use correct, context-appropriate terminology for AI, tech, and business. Keep brand/product/company names and well-known technical terms in their standard form (e.g. Google, Gemini, Gmail, AI, ByteDance, OpenAI) — do not awkwardly transliterate them.
- The "body" field is HTML. Preserve every HTML tag, attribute, and the overall structure EXACTLY. Translate only the human-readable text between tags. Never translate or alter URLs, code, or attribute values.
- Do not add, drop, or summarize content. Keep the same meaning and roughly the same length.
- Return an empty string for any field whose source is empty.
- Output ONLY the translated fields, nothing else.`;
}

/** Translate one post's fields into the target locale. Throws on failure. */
export async function translateFields(
  src: TranslatableFields,
  locale: TranslateLocale
): Promise<TranslatableFields> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 32000,
    thinking: { type: "disabled" }, // translation doesn't need thinking; keep it fast
    system: systemPrompt(locale),
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Translate these blog fields. Respond with the translated JSON object:\n${JSON.stringify(
          src
        )}`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = JSON.parse(text) as Partial<TranslatableFields>;
  return {
    title: parsed.title ?? "",
    excerpt: parsed.excerpt ?? "",
    body: parsed.body ?? "",
  };
}
