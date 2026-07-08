"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { savePortfolio, deletePortfolio } from "@/app/admin/actions";
import ImageUpload from "./ImageUpload";
import AdminSearch from "./AdminSearch";
import { useScrollJumpGuard } from "./use-scroll-jump-guard";
import type { Portfolio, PortfolioCategory } from "@/lib/types";

const CATS: PortfolioCategory[] = ["Video", "Web", "Design", "Other"];
const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

export default function PortfolioManager({ items }: { items: Portfolio[] }) {
  const [editing, setEditing] = useState<Portfolio | "new" | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tech_tags.some((t) => t.toLowerCase().includes(q))
      )
    : items;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">// Content</p>
          <h1 className="font-display text-3xl font-bold">Portfolio</h1>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <AdminSearch value={query} onChange={setQuery} placeholder="ค้นหาผลงาน / หมวด / แท็ก…" />
          <button onClick={() => setEditing("new")} className="btn-neon shrink-0 whitespace-nowrap">
            + New Portfolio
          </button>
        </div>
      </div>

      {q && (
        <p className="mb-2 font-mono text-[11px] text-muted">
          พบ {filtered.length} จาก {items.length} ผลงาน
        </p>
      )}

      <div className="glass divide-y divide-line/[0.06]">
        {items.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">No projects yet.</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">ไม่พบผลงานที่ตรงกับ “{query}”</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface/5">
                {p.thumbnail_url && (
                  <Image src={p.thumbnail_url} alt="" fill unoptimized={p.thumbnail_url.endsWith(".svg")} className="object-cover" sizes="64px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body font-medium">
                  {p.featured && <span className="mr-2 text-cyan">★</span>}
                  {p.title}
                </p>
                <p className="font-mono text-xs text-muted">
                  {p.category} · order {p.display_order}
                </p>
              </div>
              <button
                onClick={() => setEditing(p)}
                className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
              >
                Edit
              </button>
              <form action={deletePortfolio}>
                <input type="hidden" name="id" value={p.id} />
                <button className="font-mono text-xs uppercase tracking-wider text-red-400/70 hover:text-red-400">
                  Delete
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Editor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Editor({ item, onClose }: { item: Portfolio | null; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollJumpGuard(scrollRef);
  return (
    <div ref={scrollRef} className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-space" onClick={onClose} />
      <form
        action={async (fd) => {
          await savePortfolio(fd);
          onClose();
        }}
        className="glass relative z-10 my-4 w-full max-w-lg space-y-4 bg-space-light p-6"
      >
        <h2 className="font-display text-xl font-bold">
          {item ? "Edit project" : "New project"}
        </h2>
        {item && <input type="hidden" name="id" value={item.id} />}

        <Label l="Title">
          <input name="title" required defaultValue={item?.title} className={field} />
        </Label>
        <Label l="Description">
          <textarea name="description" rows={3} defaultValue={item?.description ?? ""} className={`${field} resize-none`} />
        </Label>
        <ImageUpload
          name="thumbnail_url"
          defaultValue={item?.thumbnail_url ?? ""}
          bucket="portfolio-images"
          label="Thumbnail"
        />
        <Label l="Project URL">
          <input name="project_url" defaultValue={item?.project_url ?? ""} className={field} />
        </Label>
        <Label l="Tech tags (comma separated)">
          <input name="tech_tags" defaultValue={item?.tech_tags.join(", ")} className={field} />
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Label l="Category">
            <select name="category" defaultValue={item?.category ?? "Other"} className={field}>
              {CATS.map((c) => (
                <option key={c} value={c} className="bg-space">
                  {c}
                </option>
              ))}
            </select>
          </Label>
          <Label l="Display order">
            <input type="number" name="display_order" defaultValue={item?.display_order ?? 0} className={field} />
          </Label>
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          <input type="checkbox" name="featured" defaultChecked={item?.featured} className="accent-cyan" />
          Featured on homepage (max 6 shown, ordered by display order)
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-neon flex-1">
            Save
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Label({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {l}
      </span>
      {children}
    </label>
  );
}
