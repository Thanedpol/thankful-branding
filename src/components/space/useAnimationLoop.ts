"use client";

import { useEffect, type RefObject } from "react";

/**
 * Drive a canvas animation that only spends CPU while someone can see it:
 * paused when the element scrolls offscreen or the tab is hidden, and reduced
 * to a single still frame for visitors who asked for less motion.
 *
 * `setup` runs once on mount and returns the per-frame callback — which gets
 * seconds since the last frame and since start — plus an optional `dispose`
 * for anything it attached (observers, listeners).
 */
export interface AnimationScene {
  frame: (dt: number, t: number) => void;
  dispose?: () => void;
}

export function useAnimationLoop(
  ref: RefObject<HTMLElement | null>,
  setup: () => AnimationScene | void,
  deps: unknown[] = []
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scene = setup();
    if (!scene) return;
    const { frame, dispose } = scene;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      frame(0, 0);
      return dispose;
    }

    let raf = 0;
    let visible = true;
    let last = performance.now();
    const start = last;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // a background tab can't jump the scene
      last = now;
      frame(dt, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);

    frame(0, 0);
    run();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
