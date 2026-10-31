"use client";

import { usePathname } from "next/navigation";
import StarField from "./StarField";

/**
 * The sky behind every public page: deep space in the dark theme, a daytime
 * sky in the light one. Both layers are rendered and CSS shows the one that
 * matches <html data-theme>, so the server render needs no theme and a theme
 * switch is instant. The hidden starfield pauses itself — its animation loop
 * stops when the canvas is not on screen.
 *
 * `fixed`, so the canvas only ever covers the viewport however long the page
 * is. The admin keeps its own plain surface; long reading pages get a quieter
 * sky so text stays comfortable.
 */

// Paths whose main job is reading a long piece of text.
const READING = [/^\/blog\/[^/]+/, /^\/portfolio\/[^/]+\/[^/]+/];

// Clouds: [top %, width vmax, height vmax, opacity, drift seconds, delay seconds]
const CLOUDS = [
  [8, 34, 9, 0.85, 160, -20],
  [22, 26, 7, 0.7, 210, -120],
  [38, 40, 10, 0.55, 260, -60],
  [55, 30, 8, 0.6, 190, -150],
  [70, 46, 11, 0.5, 300, -40],
] as const;

export default function SiteBackdrop() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;
  const quiet = READING.some((r) => r.test(pathname));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="sky-night absolute inset-0 bg-[#03060f]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 80% 22%, rgba(40,80,200,0.32), transparent 70%)," +
              "radial-gradient(ellipse 40% 35% at 14% 18%, rgba(90,60,200,0.22), transparent 70%)," +
              "radial-gradient(ellipse 50% 40% at 30% 85%, rgba(30,90,220,0.18), transparent 70%)," +
              "radial-gradient(ellipse 35% 30% at 92% 78%, rgba(120,70,220,0.16), transparent 70%)",
          }}
        />
        <StarField quiet={quiet} />
        {quiet && <div className="sky-dim-night absolute inset-0" />}
      </div>

      <div className="sky-day absolute inset-0 overflow-hidden">
        <div className="sky-sun" />
        {CLOUDS.map(([top, w, h, o, drift, delay], i) => (
          <div
            key={i}
            className="sky-cloud"
            style={{
              top: `${top}%`,
              width: `${w}vmax`,
              height: `${h}vmax`,
              opacity: o,
              ["--drift" as string]: `${drift}s`,
              ["--delay" as string]: `${delay}s`,
            }}
          />
        ))}
        {quiet && <div className="sky-dim-day absolute inset-0" />}
      </div>
    </div>
  );
}
