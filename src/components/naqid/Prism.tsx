/**
 * The NAQID mark — "the prism": one beam of light goes in and splits into the
 * group's three pillars: teal (Labs, build), violet (Signal, measure) and
 * amber (Entertainment, tell). Drawn from the brand files' SVG.
 *
 * `tone="light"` is for the Bone background (the white input beam becomes
 * Void so it stays visible); `tone="dark"` keeps the original colours.
 */
export default function Prism({
  size = 40,
  tone = "light",
  animate = false,
  className,
  title,
}: {
  size?: number;
  tone?: "light" | "dark";
  animate?: boolean;
  className?: string;
  title?: string;
}) {
  const frame = tone === "light" ? "#3F4B66" : "#93A4C4";
  const input = tone === "light" ? "#070B18" : "#F5F2EA";
  const beam = (n: number) => (animate ? `nq-beam nq-beam-${n}` : undefined);
  // Small marks use the brand file's stroke widths. Large ones keep thin
  // lines in screen pixels (~1px frame, 2–3px beams) — the brand prefers
  // hairlines to heavy strokes.
  const w = size >= 120 ? 2.4 * (40 / size) : 1.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M6 32 L20 8 L34 32" stroke={frame} strokeWidth={w * 0.8} opacity={0.45} />
      <path d="M20 8 L20 32" stroke={frame} strokeWidth={w * 0.55} opacity={0.25} />
      <path className={beam(1)} d="M1 20 L20 20" stroke={input} strokeWidth={w} />
      <path className={beam(2)} d="M20 20 L39 11" stroke="#00E0B8" strokeWidth={w * 1.15} />
      <path className={beam(3)} d="M20 20 L39 20" stroke="#A78BFA" strokeWidth={w * 1.15} />
      <path className={beam(4)} d="M20 20 L39 29" stroke="#FFB020" strokeWidth={w * 1.15} />
    </svg>
  );
}
