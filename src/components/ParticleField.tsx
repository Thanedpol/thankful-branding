"use client";

import { useEffect, useRef } from "react";

/**
 * Animated particle field + floating grid drawn on a canvas.
 * Sits behind the hero. Cheap, deterministic-ish, respects reduced motion.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx; // non-null captures for nested closures
    const cv = canvas;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Lighter on phones; the O(n²) link pass is the expensive part.
    const isSmall = width < 768;
    const COUNT = isSmall
      ? Math.min(28, Math.floor((width * height) / 26000))
      : Math.min(48, Math.floor((width * height) / 24000));
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.4,
    }));

    let raf = 0;
    let frame = 0;
    const LINK_DIST = 130;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

    function draw() {
      frame++;
      g.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fillStyle = "rgba(0, 245, 255, 0.7)";
        g.fill();
      }

      // Link nearby particles — skip on phones, and only every other frame
      // (uses squared distance to avoid sqrt). Lines are slow-moving, so 30fps
      // for the link layer is visually identical and much cheaper.
      if (!isSmall && frame % 2 === 0) {
        g.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK_DIST_SQ) {
              const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.18;
              g.beginPath();
              g.strokeStyle = `rgba(123, 47, 255, ${alpha})`;
              g.moveTo(a.x, a.y);
              g.lineTo(b.x, b.y);
              g.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function onResize() {
      width = cv.width = cv.offsetWidth;
      height = cv.height = cv.offsetHeight;
    }

    window.addEventListener("resize", onResize);
    if (!reduced) draw();
    else {
      // Single static frame.
      for (const p of particles) {
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fillStyle = "rgba(0, 245, 255, 0.5)";
        g.fill();
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
