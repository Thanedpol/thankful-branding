"use client";

import { useState } from "react";

type State = "idle" | "busy" | "done" | "err";

/** Per-post "re-translate with AI" trigger for the blog admin list. */
export default function TranslateButton({ id }: { id: string }) {
  const [state, setState] = useState<State>("idle");

  async function run() {
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/translate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, force: true }),
      });
      const data = await res.json().catch(() => ({}));
      setState(data?.ok ? "done" : "err");
    } catch {
      setState("err");
    }
  }

  const label =
    state === "busy" ? "⏳ กำลังแปล…" : state === "done" ? "✓ แปลแล้ว" : state === "err" ? "⚠ ลองใหม่" : "🌐 แปล";

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === "busy"}
      title="แปลด้วย AI เป็น EN / 简体中文"
      className={`font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-60 ${
        state === "err" ? "text-red-400/80 hover:text-red-400" : "text-purple/70 hover:text-purple"
      }`}
    >
      {label}
    </button>
  );
}
