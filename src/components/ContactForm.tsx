"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import Toast, { type ToastState } from "./Toast";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      setToast({ kind: "success", message: "Message transmitted. I'll be in touch." });
      form.reset();
    } catch {
      setToast({ kind: "error", message: "Transmission failed. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-white placeholder:text-white/30 outline-none transition-colors focus:border-cyan/50 focus:shadow-glow-cyan";

  return (
    <section id="contact" className="section-pad scroll-mt-20">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">// Open a channel</p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Let&apos;s build the <span className="text-gradient">future</span>
          </h2>
          <p className="text-muted">
            Collaborations, speaking, press, or just a good idea — send a signal
            and I&apos;ll respond.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={handleSubmit} className="glass space-y-4 p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="sender_name" required placeholder="Name" className={field} />
              <input
                name="sender_email"
                type="email"
                required
                placeholder="Email"
                className={field}
              />
            </div>
            <input name="subject" placeholder="Subject" className={field} />
            <textarea
              name="body"
              required
              rows={5}
              placeholder="Your message…"
              className={`${field} resize-none`}
            />
            <button type="submit" disabled={loading} className="btn-neon w-full">
              {loading ? "Transmitting…" : "Send Message →"}
            </button>
          </form>
        </Reveal>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
