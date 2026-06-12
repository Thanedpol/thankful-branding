"use client";

import { useEffect } from "react";

export type ToastKind = "success" | "error";

export interface ToastState {
  kind: ToastKind;
  message: string;
}

export default function Toast({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const accent =
    toast.kind === "success" ? "border-cyan/50 text-cyan" : "border-red-500/50 text-red-400";

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fade-up"
    >
      <div
        className={`glass flex items-center gap-3 px-5 py-3 font-mono text-sm ${accent}`}
      >
        <span className="text-lg leading-none">
          {toast.kind === "success" ? "◉" : "⚠"}
        </span>
        <span className="text-white">{toast.message}</span>
      </div>
    </div>
  );
}
