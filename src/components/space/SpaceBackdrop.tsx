"use client";

import StarField from "./StarField";

/**
 * Deep space pinned behind the whole home page. It is `fixed`, so the starfield
 * canvas only ever covers the viewport however long the page grows, while the
 * header, footer and content cards sit on top with their own opaque surfaces.
 */
export default function SpaceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#03060f]">
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
      <StarField />
    </div>
  );
}
