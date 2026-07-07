"use client";

import { useRef, useState } from "react";
import { saveBlog, deleteBlog } from "@/app/admin/actions";
import ImageUpload from "./ImageUpload";
import RichTextEditor from "./RichTextEditor";
import { useScrollJumpGuard } from "./use-scroll-jump-guard";
import type { BlogPost } from "@/lib/types";

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

export default function BlogManager({ posts }: { posts: BlogPost[] }) {
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">// Content</p>
          <h1 className="font-display text-3xl font-bold">Blog</h1>
        </div>
        <button onClick={() => setEditing("new")} className="btn-neon">
          + New Post
        </button>
      </div>

      <div className="glass divide-y divide-line/[0.06]">
        {posts.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">No posts yet.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-body font-medium">{p.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
                  <Badge
                    on={p.status === "published"}
                    yes="published"
                    no="draft"
                  />
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      p.is_public
                        ? "border border-cyan/30 text-cyan/80"
                        : "border border-purple/40 text-purple"
                    }`}
                  >
                    {p.is_public ? "public" : "⬡ members"}
                  </span>
                  <span className="text-ink/30">/{p.slug}</span>
                </p>
              </div>
              <button
                onClick={() => setEditing(p)}
                className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
              >
                Edit
              </button>
              <form action={deleteBlog}>
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
        <Editor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 ${
        on ? "border border-green-400/30 text-green-400" : "border border-line/15 text-muted"
      }`}
    >
      {on ? yes : no}
    </span>
  );
}

function Editor({ item, onClose }: { item: BlogPost | null; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollJumpGuard(scrollRef);
  return (
    <div ref={scrollRef} className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-space" onClick={onClose} />
      <form
        action={async (fd) => {
          await saveBlog(fd);
          onClose();
        }}
        className="glass relative z-10 my-4 w-full max-w-2xl space-y-4 bg-space-light p-6"
      >
        <h2 className="font-display text-xl font-bold">
          {item ? "Edit post" : "New post"}
        </h2>
        {item && <input type="hidden" name="id" value={item.id} />}

        <L l="Title">
          <input name="title" required defaultValue={item?.title} className={field} />
        </L>
        <L l="Slug (auto from title if blank)">
          <input name="slug" defaultValue={item?.slug} className={field} />
        </L>
        <ImageUpload
          name="cover_image_url"
          defaultValue={item?.cover_image_url ?? ""}
          bucket="blog-images"
          label="Cover image"
        />
        <L l="Excerpt (shown publicly as preview)">
          <textarea name="excerpt" rows={2} defaultValue={item?.excerpt ?? ""} className={`${field} resize-none`} />
        </L>
        <L l="Body (rich text) — public teaser, everyone can read">
          <RichTextEditor name="body" defaultValue={item?.body ?? ""} />
        </L>
        <div className="rounded-lg border border-purple/25 bg-purple/[0.04] p-3">
          <L l="⬡ Member-only content (เฉพาะสมาชิก) — optional">
            <RichTextEditor name="member_body" defaultValue={item?.member_body ?? ""} />
          </L>
          <p className="mt-1 font-mono text-[10px] text-muted">
            แสดงต่อจากเนื้อหาสาธารณะ เฉพาะสมาชิกที่ล็อกอินเท่านั้น · คนทั่วไปจะเห็นกล่องชวนสมัคร
          </p>
        </div>
        <L l="Tags (comma separated)">
          <input name="tags" defaultValue={item?.tags.join(", ")} className={field} />
        </L>

        <div className="grid grid-cols-2 gap-4">
          <L l="Status">
            <select name="status" defaultValue={item?.status ?? "draft"} className={field}>
              <option value="draft" className="bg-space">draft</option>
              <option value="published" className="bg-space">published</option>
            </select>
          </L>
          <label className="flex items-end gap-2 pb-2 font-mono text-xs text-muted">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={item ? item.is_public : true}
              className="accent-cyan"
            />
            Public (uncheck = members-only body)
          </label>
        </div>

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

function L({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {l}
      </span>
      {children}
    </label>
  );
}
