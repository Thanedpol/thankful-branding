"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Keep a scrollable admin modal from being yanked up to the top when a field
 * inside it (rich-text editor, input, textarea) gains focus. The browser's
 * focus-scroll reveals the focused element by scrolling the modal — and does it
 * again a beat later when images finish loading and the layout reflows.
 *
 * On any mousedown / Enter inside the container we record the scroll position
 * and, for a short window, undo any *upward* jump — leaving a downward scroll
 * (following the caret) and any scrolling the user does themselves untouched.
 */
export function useScrollJumpGuard(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const sp = ref.current;
    if (!sp) return;

    const guard = () => {
      const top = sp.scrollTop;
      let stopped = false;
      const stop = () => (stopped = true);
      sp.addEventListener("wheel", stop, { passive: true });
      sp.addEventListener("touchmove", stop, { passive: true });
      const cleanup = () => {
        sp.removeEventListener("wheel", stop);
        sp.removeEventListener("touchmove", stop);
      };
      const start = performance.now();
      const tick = () => {
        if (stopped) return cleanup();
        if (top - sp.scrollTop > 4) sp.scrollTop = top;
        if (performance.now() - start < 700) requestAnimationFrame(tick);
        else cleanup();
      };
      requestAnimationFrame(tick);
    };

    const onDown = () => guard();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") guard();
    };
    sp.addEventListener("mousedown", onDown, true);
    sp.addEventListener("keydown", onKey, true);
    return () => {
      sp.removeEventListener("mousedown", onDown, true);
      sp.removeEventListener("keydown", onKey, true);
    };
  }, [ref]);
}
