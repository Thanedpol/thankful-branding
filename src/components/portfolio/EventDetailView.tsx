import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionCarousel from "./SessionCarousel";
import { eventSessions, type EventItem } from "@/lib/portfolio-sessions";

export type { EventItem };

/** Detail page for an event: its title + cover, then a carousel of its
 *  sub-sessions (sub-blogs), then the main Facebook post link. */
export default function EventDetailView({
  event,
  backHref,
  backLabel,
}: {
  event: EventItem;
  backHref: string;
  backLabel: string;
}) {
  const sessions = eventSessions(event);

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

          {sessions.length > 0 && (
            <div className="mt-10">
              <SessionCarousel items={sessions} />
            </div>
          )}

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
