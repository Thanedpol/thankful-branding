import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type EventItem = {
  title: string;
  url: string;
  image?: string;
  body?: string;
  slug?: string;
};

/** Detail page for a collection event's rich content (blog-post style). */
export default function EventDetailView({
  event,
  backHref,
  backLabel,
}: {
  event: EventItem;
  backHref: string;
  backLabel: string;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <article className="mx-auto max-w-3xl px-6 pb-24">
          <Link
            href={backHref}
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
          >
            {backLabel}
          </Link>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
            {event.title}
          </h1>

          {event.image && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div
            className="prose-cyber mt-10"
            dangerouslySetInnerHTML={{ __html: event.body ?? "" }}
          />

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon mt-10"
            >
              ดูโพสต์ Facebook →
            </a>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
