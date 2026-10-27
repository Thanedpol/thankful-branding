"use client";

import EarthCanvas from "./EarthCanvas";

/**
 * Earth wrapped in tilted golden orbits. Each orbit sways gently about its
 * tilt — a full precession would sweep some rings upright, which reads as
 * noise rather than orbits — and carries a point of light around itself.
 *
 * Depth is faked with a mask: the rings sit above the globe but are hidden
 * across the upper half of its disc, so every ring appears to pass behind the
 * top of the planet and in front of the bottom.
 */

const C = 300; // viewBox centre
const EARTH_R = 152; // matches the 50.6% globe below

const ORBITS = [
  { rx: 290, ry: 92, tilt: -18, dur: 26, dash: false, dot: 18 },
  { rx: 262, ry: 130, tilt: 16, dur: 34, dash: false, dot: 26 },
  { rx: 298, ry: 58, tilt: 4, dur: 22, dash: true, dot: 14 },
  { rx: 236, ry: 168, tilt: -34, dur: 40, dash: true, dot: 32 },
  { rx: 280, ry: 110, tilt: 38, dur: 30, dash: false, dot: 22 },
];

const ellipsePath = (rx: number, ry: number) =>
  `M ${C - rx},${C} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0`;

function Rings({ id, front }: { id: string; front?: boolean }) {
  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe3a3" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f2b94b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd27a" stopOpacity="0.85" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {front && (
          // Show the rings over the planet only across its lower half.
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-100" y="-100" width="800" height="800">
            <rect x="-100" y="-100" width="800" height="800" fill="white" />
            <path
              d={`M ${C - EARTH_R},${C} A ${EARTH_R},${EARTH_R} 0 0,1 ${C + EARTH_R},${C} Z`}
              fill="black"
            />
          </mask>
        )}
      </defs>

      <g mask={front ? `url(#${id}-mask)` : undefined} filter={`url(#${id}-glow)`}>
        {ORBITS.map((o, i) => (
          <g key={i} transform={`rotate(${o.tilt} ${C} ${C})`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={[0, i % 2 ? -14 : 14, 0].map((d) => `${o.tilt + d} ${C} ${C}`).join(";")}
              keyTimes="0;0.5;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              dur={`${o.dur}s`}
              repeatCount="indefinite"
            />
            <ellipse
              cx={C}
              cy={C}
              rx={o.rx}
              ry={o.ry}
              fill="none"
              stroke={`url(#${id}-gold)`}
              strokeWidth={o.dash ? 1 : 1.4}
              strokeDasharray={o.dash ? "2 7" : undefined}
              opacity={front ? 0.75 : 0.5}
            />
            {front && (
              <circle r="3.4" fill="#fff4d6">
                <animateMotion dur={`${o.dot}s`} repeatCount="indefinite" path={ellipsePath(o.rx, o.ry)} />
              </circle>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function OrbitSystem({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* soft blue bloom behind everything */}
      <div
        aria-hidden
        className="space-pulse absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(70,150,255,0.38) 0%, rgba(40,90,220,0.16) 38%, transparent 68%)",
        }}
      />

      {/* the globe, with an atmosphere halo */}
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[50.6%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          boxShadow:
            "0 0 28px 6px rgba(110,190,255,0.55), 0 0 90px 24px rgba(60,130,255,0.35), inset 0 0 22px rgba(160,220,255,0.35)",
        }}
      >
        <EarthCanvas className="rounded-full" />
      </div>

      <Rings id="orb" front />

      {/* a small planet riding high on the left */}
      <div className="space-float absolute left-[6%] top-[4%] w-[9%]" style={{ animationDuration: "11s" }}>
        <div
          className="aspect-square w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 30%, #b9c8e6 0%, #56688c 38%, #1a2238 72%, #0a0f1d 100%)",
            boxShadow: "0 0 18px rgba(140,180,255,0.35)",
          }}
        />
      </div>

      {/* the moon, lower right */}
      <div
        className="space-float absolute bottom-[10%] right-[-4%] w-[17%]"
        style={{ animationDuration: "14s", animationDelay: "-5s" }}
      >
        <div
          className="aspect-square w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 24% 50%, rgba(0,0,0,0.25) 0 5%, transparent 6%), radial-gradient(circle at 58% 34%, rgba(0,0,0,0.22) 0 7%, transparent 8%), radial-gradient(circle at 46% 70%, rgba(0,0,0,0.2) 0 4%, transparent 5%), radial-gradient(circle at 30% 30%, #f1f1f1 0%, #a9abb3 40%, #4a4d57 75%, #15171d 100%)",
            boxShadow: "0 0 30px rgba(200,210,255,0.22)",
          }}
        />
      </div>
    </div>
  );
}
