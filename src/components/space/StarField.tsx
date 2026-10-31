"use client";

import { useRef } from "react";
import { useAnimationLoop } from "./useAnimationLoop";

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  speed: number; // twinkle rate
  phase: number;
  depth: number; // parallax: nearer stars drift faster
  hue: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const HUES = ["255,255,255", "255,255,255", "255,255,255", "170,205,255", "255,214,150"];

/**
 * Twinkling, slowly drifting starfield with the odd shooting star. `quiet`
 * thins the stars and drops the shooting stars — for reading pages.
 */
export default function StarField({ className = "", quiet = false }: { className?: string; quiet?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useAnimationLoop(ref, () => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    let nextMeteor = 3;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(quiet ? 220 : 520, Math.floor((w * h) / (quiet ? 6500 : 2600)));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.25 + depth * depth * 1.5,
          base: 0.25 + Math.random() * 0.6,
          speed: 0.6 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          depth,
          hue: HUES[Math.floor(Math.random() * HUES.length)],
        };
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = (dt: number, t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.x -= dt * (1.5 + s.depth * 5);
        if (s.x < -2) s.x = w + 2;
        const a = Math.max(0, Math.min(1, s.base + Math.sin(t * s.speed + s.phase) * 0.35));
        ctx.fillStyle = `rgba(${s.hue},${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          // the brightest few get a soft halo
          ctx.fillStyle = `rgba(${s.hue},${a * 0.12})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      nextMeteor -= dt;
      if (!quiet && nextMeteor <= 0 && dt > 0) {
        nextMeteor = 6 + Math.random() * 8;
        const speed = 700 + Math.random() * 400;
        meteors.push({
          x: w * (0.3 + Math.random() * 0.7),
          y: h * Math.random() * 0.4,
          vx: -speed * 0.85,
          vy: speed * 0.5,
          life: 1,
        });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt * 1.1;
        if (m.life <= 0) {
          meteors.splice(i, 1);
          continue;
        }
        const tail = 0.12;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
        grad.addColorStop(0, `rgba(255,236,200,${m.life})`);
        grad.addColorStop(1, "rgba(255,236,200,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
        ctx.stroke();
      }
    };
    return { frame, dispose: () => ro.disconnect() };
  }, [quiet]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none h-full w-full ${className}`} />;
}
