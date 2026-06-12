"use client";

interface Props {
  text: string;
  className?: string;
}

/** Continuously-glitching neon text with a one-shot intro glitch on mount. */
export default function GlitchText({ text, className = "" }: Props) {
  return (
    <span
      data-text={text}
      className={`glitch glitch-load font-display ${className}`}
    >
      {text}
    </span>
  );
}
