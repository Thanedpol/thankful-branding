import T from "./T";
import { FAQ_ITEMS } from "@/lib/seo";

/**
 * The FAQ the home page's FAQPage structured data describes, shown on the
 * page. Structured data has to match visible text; and each answer is a short
 * self-contained passage an answer engine can quote. Server-rendered
 * <details>, so the answers are in the HTML even while collapsed.
 */
export default function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="section-pad scroll-mt-20">
      <div className="space-plate">
        <p className="eyebrow">
          <T k="faq.eyebrow" />
        </p>
        <h2 id="faq-heading" className="font-display text-3xl font-bold md:text-4xl text-gradient">
          <T k="faq.heading" />
        </h2>
        <div className="mt-6 divide-y divide-line/10 border-t border-line/10">
          {FAQ_ITEMS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold text-ink md:text-lg">{f.q}</h3>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-xl leading-none text-cyan transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
