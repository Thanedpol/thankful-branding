"use client";

import { useState } from "react";
import { savePortfolioCollection } from "@/app/admin/actions";
import type { PortfolioCollection } from "@/lib/types";

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

type Story = { title?: string; detail: string; youtubeUrl: string };
type Ev = { title: string; url: string; image?: string };
type Grp = { name: string; popular?: boolean; events: Ev[] };

export default function CollectionsManager({
  collections,
}: {
  collections: PortfolioCollection[];
}) {
  const [editing, setEditing] = useState<PortfolioCollection | null>(null);

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">// Content</p>
        <h1 className="font-display text-3xl font-bold">Portfolio Collections</h1>
        <p className="mt-1 text-sm text-muted">
          แก้ไขหน้าผลงานรวม — Snobby Story และ Insightist
        </p>
      </div>

      <div className="glass divide-y divide-line/[0.06]">
        {collections.map((c) => {
          const count = c.data.stories
            ? `${c.data.stories.length} เรื่อง`
            : `${c.data.groups?.reduce((n, g) => n + g.events.length, 0) ?? 0} งาน`;
          return (
            <div key={c.slug} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-body font-medium">{c.title}</p>
                <p className="font-mono text-xs text-muted">
                  /portfolio/{c.slug} · {count}
                </p>
              </div>
              <a
                href={`/portfolio/${c.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-wider text-muted hover:text-cyan"
              >
                View
              </a>
              <button
                onClick={() => setEditing(c)}
                className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {editing && <Editor collection={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Editor({
  collection,
  onClose,
}: {
  collection: PortfolioCollection;
  onClose: () => void;
}) {
  const kind: "stories" | "groups" =
    collection.slug === "insightist" ? "groups" : "stories";

  const [title, setTitle] = useState(collection.title);
  const [tagline, setTagline] = useState(collection.tagline ?? "");
  const [intro, setIntro] = useState(collection.intro ?? "");
  const [category, setCategory] = useState(collection.category ?? "");
  const [tags, setTags] = useState((collection.tags ?? []).join(", "));
  const [stories, setStories] = useState<Story[]>(collection.data.stories ?? []);
  const [groups, setGroups] = useState<Grp[]>(collection.data.groups ?? []);

  const payload = {
    title,
    tagline: tagline || null,
    intro: intro || null,
    category: category || null,
    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    data: kind === "stories" ? { stories } : { groups },
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-space/80 backdrop-blur-sm" onClick={onClose} />
      <form
        action={async (fd) => {
          await savePortfolioCollection(fd);
          onClose();
        }}
        className="glass relative z-10 my-4 w-full max-w-2xl space-y-4 p-6"
      >
        <h2 className="font-display text-xl font-bold">แก้ไข: {collection.title}</h2>
        <input type="hidden" name="slug" value={collection.slug} />
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />

        <L l="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </L>
        <L l="Tagline">
          <textarea value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} className={`${field} resize-none`} />
        </L>
        <L l="Intro">
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className={`${field} resize-none`} />
        </L>
        <div className="grid grid-cols-2 gap-4">
          <L l="Category">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={field} />
          </L>
          <L l="Tags (คั่นด้วย ,)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
          </L>
        </div>

        {kind === "stories" ? (
          <StoriesEditor stories={stories} setStories={setStories} />
        ) : (
          <GroupsEditor groups={groups} setGroups={setGroups} />
        )}

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

/* ── Snobby Story: flat list of stories ─────────────────────────────────────*/
function StoriesEditor({
  stories,
  setStories,
}: {
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
}) {
  const patch = (i: number, p: Partial<Story>) =>
    setStories((s) => s.map((x, ix) => (ix === i ? { ...x, ...p } : x)));
  const add = () => setStories((s) => [...s, { title: "", detail: "", youtubeUrl: "" }]);
  const remove = (i: number) => setStories((s) => s.filter((_, ix) => ix !== i));
  const move = (i: number, d: number) =>
    setStories((s) => {
      const a = [...s];
      const j = i + d;
      if (j < 0 || j >= a.length) return a;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  return (
    <Section title="เรื่องราว (Stories)" onAdd={add} addLabel="+ เพิ่มเรื่อง">
      {stories.map((s, i) => (
        <Card key={i} index={i} count={stories.length} onMove={move} onRemove={remove}>
          <input placeholder="ชื่อเรื่อง" value={s.title ?? ""} onChange={(e) => patch(i, { title: e.target.value })} className={field} />
          <textarea placeholder="รายละเอียด" value={s.detail} onChange={(e) => patch(i, { detail: e.target.value })} rows={2} className={`${field} mt-2 resize-none`} />
          <input placeholder="ลิงก์ YouTube (https://...)" value={s.youtubeUrl} onChange={(e) => patch(i, { youtubeUrl: e.target.value })} className={`${field} mt-2`} />
        </Card>
      ))}
    </Section>
  );
}

/* ── Insightist: groups → events ────────────────────────────────────────────*/
function GroupsEditor({
  groups,
  setGroups,
}: {
  groups: Grp[];
  setGroups: React.Dispatch<React.SetStateAction<Grp[]>>;
}) {
  const patchG = (gi: number, p: Partial<Grp>) =>
    setGroups((g) => g.map((x, ix) => (ix === gi ? { ...x, ...p } : x)));
  const addG = () => setGroups((g) => [...g, { name: "", events: [] }]);
  const rmG = (gi: number) => setGroups((g) => g.filter((_, ix) => ix !== gi));
  const moveG = (gi: number, d: number) =>
    setGroups((g) => {
      const a = [...g];
      const j = gi + d;
      if (j < 0 || j >= a.length) return a;
      [a[gi], a[j]] = [a[j], a[gi]];
      return a;
    });
  const setEvents = (gi: number, events: Ev[]) => patchG(gi, { events });

  return (
    <Section title="กลุ่ม & งาน (Groups)" onAdd={addG} addLabel="+ เพิ่มกลุ่ม">
      {groups.map((g, gi) => (
        <Card key={gi} index={gi} count={groups.length} onMove={moveG} onRemove={rmG}>
          <input placeholder="ชื่อกลุ่ม" value={g.name} onChange={(e) => patchG(gi, { name: e.target.value })} className={field} />
          <label className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted">
            <input type="checkbox" checked={!!g.popular} onChange={(e) => patchG(gi, { popular: e.target.checked })} className="accent-cyan" />
            กลุ่มยอดนิยม (★ ไม่นับรวมจำนวนงาน)
          </label>
          <EventsEditor events={g.events} setEvents={(ev) => setEvents(gi, ev)} />
        </Card>
      ))}
    </Section>
  );
}

function EventsEditor({
  events,
  setEvents,
}: {
  events: Ev[];
  setEvents: (ev: Ev[]) => void;
}) {
  const patch = (i: number, p: Partial<Ev>) =>
    setEvents(events.map((x, ix) => (ix === i ? { ...x, ...p } : x)));
  const add = () => setEvents([...events, { title: "", url: "", image: "" }]);
  const remove = (i: number) => setEvents(events.filter((_, ix) => ix !== i));
  const move = (i: number, d: number) => {
    const a = [...events];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setEvents(a);
  };

  return (
    <div className="mt-3 space-y-2 border-l border-line/10 pl-3">
      {events.map((e, i) => (
        <div key={i} className="rounded-md border border-line/10 bg-surface/[0.02] p-2">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted">
            <span>งานที่ {i + 1}</span>
            <span className="flex gap-1.5">
              <button type="button" onClick={() => move(i, -1)} className="hover:text-cyan">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="hover:text-cyan">↓</button>
              <button type="button" onClick={() => remove(i)} className="text-red-400/70 hover:text-red-400">✕</button>
            </span>
          </div>
          <input placeholder="ชื่องาน" value={e.title} onChange={(ev) => patch(i, { title: ev.target.value })} className={field} />
          <input placeholder="ลิงก์ Facebook (https://...)" value={e.url} onChange={(ev) => patch(i, { url: ev.target.value })} className={`${field} mt-1.5`} />
          <input placeholder="ลิงก์รูป (ไม่บังคับ เช่น /portfolio/xxx.png)" value={e.image ?? ""} onChange={(ev) => patch(i, { image: ev.target.value })} className={`${field} mt-1.5`} />
        </div>
      ))}
      <button type="button" onClick={add} className="rounded-md border border-cyan/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-cyan/80 hover:bg-cyan/10">
        + เพิ่มงาน
      </button>
    </div>
  );
}

/* ── Shared bits ────────────────────────────────────────────────────────────*/
function Section({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line/10 p-3">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-cyan/80">{title}</p>
      <div className="space-y-3">{children}</div>
      <button type="button" onClick={onAdd} className="mt-3 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan/20">
        {addLabel}
      </button>
    </div>
  );
}

function Card({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  onMove: (i: number, d: number) => void;
  onRemove: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line/10 bg-surface/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
        <span>#{index + 1}</span>
        <span className="flex gap-2">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="disabled:opacity-30 hover:text-cyan">↑</button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === count - 1} className="disabled:opacity-30 hover:text-cyan">↓</button>
          <button type="button" onClick={() => onRemove(index)} className="text-red-400/70 hover:text-red-400">✕ ลบ</button>
        </span>
      </div>
      {children}
    </div>
  );
}

function L({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">{l}</span>
      {children}
    </label>
  );
}
