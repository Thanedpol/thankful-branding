"use client";

import { useT } from "@/components/providers/AppProvider";

/** Inline translated string — usable inside Server Components. */
export default function T({ k }: { k: string }) {
  return <>{useT()(k)}</>;
}
