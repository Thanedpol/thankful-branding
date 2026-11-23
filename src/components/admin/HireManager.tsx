"use client";

import { useState, useTransition } from "react";
import {
  saveHireWork,
  deleteHireWork,
  toggleHireWork,
  moveHireWork,
} from "@/app/admin/actions";
import ImageUpload from "./ImageUpload";
import { DEFAULT_HIRE_ITEMS, parseHireUrl } from "@/lib/hire";

export type HireRow = {
  id: string;
  kind: "youtube" | "tiktok";
  url: string;
  video_id: string;
  title: string | null;
  cover_url: string | null;
  display_order: number;
  hidden: boolean;
};

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";
const label = "mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted";

/** A deploy while this page is open invalidates its server-action ids. */
const STALE_RE = /Server Action|failed-to-find-server-action|was not found on the server/i;
const STALE_MSG = "เว็บมีการอัปเดตหลังจากคุณเปิดหน้านี้ — กรุณารีเฟรชหน้า (F5) แล้วลองใหม่";

function thumbOf(r: Pick<HireRow, "kind" | "video_id" | "cover_url">) {
  if (r.cover_url) return r.cover_url;
  return r.kind === "youtube" ? `https://i.ytimg.com/vi/${r.video_id}/hqdefault.jpg` : null;
}

export default function HireManager({ rows, ready }: { rows: HireRow[]; ready: boolean }) {
  // null = closed, "new" = adding, otherwise the row being edited
  const [editing, setEditing] = useState<HireRow | "new" | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsedKind = parseHireUrl(formUrl)?.kind ?? null;

  function open(target: HireRow | "new") {
    setEditing(target);
    setFormUrl(target === "new" ? "" : target.url);
    setError(null);
  }

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.error) setError(res.error);
        else after?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(STALE_RE.test(msg) ? STALE_MSG : msg || "บันทึกไม่สำเร็จ");
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => saveHireWork(fd), () => setEditing(null));
  }

  const call = (fn: (fd: FormData) => Promise<{ error?: string }>, fields: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    run(() => fn(fd));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">// Content</p>
          <h1 className="font-display text-3xl font-bold">Hire · ผลงานตัวอย่าง</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            คลิปที่แสดงในส่วน “รับงาน” บนหน้าแรก (4 YouTube + 4 TikTok แรก) และทั้งหมดในหน้า{" "}
            <a href="/work" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
              /work
            </a>
          </p>
        </div>
        {ready && (
          <button onClick={() => open("new")} className="btn-neon shrink-0 whitespace-nowrap">
            + เพิ่มคลิป
          </button>
        )}
      </div>

      {!ready && (
        <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          <p className="font-semibold">ยังแก้ไขรายการไม่ได้ — ตาราง hire_works ยังไม่ถูกสร้าง</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>เปิด Supabase › SQL Editor</li>
            <li>
              คัดลอกเนื้อหาไฟล์ <code className="font-mono">supabase/add-hire-works.sql</code> ไปวางแล้วกด Run (รันซ้ำได้ ไม่ซ้ำข้อมูล)
            </li>
            <li>รีเฟรชหน้านี้ — จะเห็นคลิปชุดปัจจุบันของเว็บในรายการ พร้อมแก้ไขได้</li>
          </ol>
          <p className="mt-2 text-xs text-amber-200/80">ระหว่างนี้เว็บแสดงคลิปชุดเริ่มต้นตามปกติ</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </p>
      )}

      {editing && ready && (
        <form
          key={editing === "new" ? "new" : editing.id}
          onSubmit={onSubmit}
          className="glass mb-6 space-y-4 p-5"
        >
          <h2 className="font-display text-lg font-bold">{editing === "new" ? "เพิ่มคลิป" : "แก้ไขคลิป"}</h2>
          {editing !== "new" && <input type="hidden" name="id" value={editing.id} />}

          <label className="block">
            <span className={label}>ลิงก์คลิป (YouTube หรือ TikTok) *</span>
            <input
              name="url"
              required
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://youtu.be/… หรือ https://www.tiktok.com/@ชื่อ/video/…"
              className={field}
            />
            <span className="mt-1 block font-mono text-[11px] text-muted">
              {formUrl.trim() === ""
                ? "วางลิงก์จากช่อง Share ได้เลย — ลิงก์สั้นของ TikTok (vm.tiktok.com) ใช้ไม่ได้ ให้เปิดคลิปแล้วคัดลอกลิงก์เต็ม"
                : parsedKind
                ? `✓ ตรวจพบ ${parsedKind === "youtube" ? "YouTube" : "TikTok"}`
                : "✗ ลิงก์นี้ยังไม่ใช่ลิงก์ของคลิป YouTube หรือ TikTok"}
            </span>
          </label>

          <label className="block">
            <span className={label}>ชื่อคลิป {parsedKind === "youtube" ? "(เว้นว่าง = ดึงจาก YouTube ให้เอง)" : ""}</span>
            <input name="title" defaultValue={editing === "new" ? "" : editing.title ?? ""} className={field} />
          </label>

          <ImageUpload
            name="cover_url"
            bucket="portfolio-images"
            label={
              parsedKind === "tiktok"
                ? "ภาพหน้าปก (TikTok ควรใส่ — ระบบดึงภาพให้ไม่ได้)"
                : "ภาพหน้าปก (ไม่ต้องใส่ — YouTube ใช้ภาพของคลิปเอง ใส่เมื่อต้องการภาพอื่น)"
            }
            defaultValue={editing === "new" ? "" : editing.cover_url ?? ""}
          />

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="btn-neon disabled:opacity-50">
              {pending ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {ready ? (
        <div className="glass divide-y divide-line/[0.06]">
          {rows.length === 0 && (
            <p className="p-6 font-mono text-sm text-muted">
              ยังไม่มีคลิป — กด “+ เพิ่มคลิป” (เว็บจะไม่แสดงส่วนคลิปเมื่อรายการว่าง)
            </p>
          )}
          {rows.map((r, i) => {
            const thumb = thumbOf(r);
            return (
              <div key={r.id} className={`flex items-center gap-3 p-3 sm:gap-4 ${r.hidden ? "opacity-50" : ""}`}>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={pending || i === 0}
                    onClick={() => call(moveHireWork, { id: r.id, dir: "up" })}
                    aria-label="เลื่อนขึ้น"
                    className="px-1 text-muted hover:text-cyan disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={pending || i === rows.length - 1}
                    onClick={() => call(moveHireWork, { id: r.id, dir: "down" })}
                    aria-label="เลื่อนลง"
                    className="px-1 text-muted hover:text-cyan disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>

                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-line/10 bg-surface/5">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink/30">
                      no cover
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium">{r.title || "(ไม่มีชื่อ)"}</p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    <span className="mr-2 rounded border border-line/15 px-1.5 py-px uppercase">
                      {r.kind === "youtube" ? "YouTube" : "TikTok"}
                    </span>
                    {r.hidden && <span className="mr-2 text-amber-400">ซ่อนอยู่</span>}
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan">
                      {r.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </p>
                  {r.kind === "tiktok" && !r.cover_url && (
                    <p className="font-mono text-[11px] text-amber-400">ยังไม่มีภาพหน้าปก — ควรใส่ภาพ</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-wider">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => call(toggleHireWork, { id: r.id, hidden: String(!r.hidden) })}
                    title={r.hidden ? "ซ่อนอยู่ — กดเพื่อแสดงบนเว็บ" : "แสดงอยู่ — กดเพื่อซ่อน"}
                    aria-pressed={r.hidden}
                    className={r.hidden ? "text-amber-400 hover:text-amber-300" : "text-muted hover:text-cyan"}
                  >
                    {r.hidden ? "🚫" : "👁"}
                  </button>
                  <button type="button" onClick={() => open(r)} className="text-cyan/70 hover:text-cyan">
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`ลบคลิปนี้ออกจากรายการ?\n\n${r.title || r.url}`)) call(deleteHireWork, { id: r.id });
                    }}
                    className="text-red-400/70 hover:text-red-400"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass divide-y divide-line/[0.06] opacity-70">
          <p className="p-4 font-mono text-xs text-muted">คลิปที่เว็บแสดงอยู่ตอนนี้ (ชุดเริ่มต้น — ดูอย่างเดียว)</p>
          {DEFAULT_HIRE_ITEMS.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-3">
              <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-line/10 bg-surface/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.cover || `https://i.ytimg.com/vi/${d.videoId}/hqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm">{d.title}</p>
                <p className="font-mono text-[11px] uppercase text-muted">{d.kind}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
