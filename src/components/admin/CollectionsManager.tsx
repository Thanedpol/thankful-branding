"use client";

import { useRef, useState } from "react";
import {
  savePortfolioCollection,
  deletePortfolioCollection,
} from "@/app/admin/actions";
import RichTextEditor from "./RichTextEditor";
import AdminSearch from "./AdminSearch";
import { slugify } from "@/lib/slugify";
import { hasContent } from "@/lib/portfolio-sessions";
import { compressImage } from "@/lib/compress-image";
import { useScrollJumpGuard } from "./use-scroll-jump-guard";
import type { PortfolioCollection, CollectionEventMetrics } from "@/lib/types";

type PortfolioLink = { id: string; title: string; project_url: string | null };
const DEFAULT_SLUGS = ["snobby-story", "insightist"];

function emptyCollection(): PortfolioCollection {
  return {
    slug: "",
    title: "",
    tagline: null,
    intro: null,
    category: null,
    tags: [],
    data: { stories: [] },
  };
}

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

// Stable keys so each rich-text editor stays bound to its item across reorders.
let uid = 0;
const key = () => `k${++uid}`;

/** Parse a number input's text → integer, or undefined when blank/invalid. */
const numOrUndef = (s: string): number | undefined => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
};

type Story = { _k: string; title?: string; detail: string; youtubeUrl: string };
type Sess = { _k: string; title?: string; image?: string; body?: string; url?: string; _stripped?: boolean };
type Ev = { _k: string; title: string; url: string; image?: string; body?: string; slug?: string; metrics?: CollectionEventMetrics; _stripped?: boolean; sessions: Sess[] };
type Grp = { _k: string; name: string; popular?: boolean; events: Ev[] };

export default function CollectionsManager({
  collections,
  portfolios,
}: {
  collections: PortfolioCollection[];
  portfolios: PortfolioLink[];
}) {
  const [editing, setEditing] = useState<{
    collection: PortfolioCollection;
    isNew: boolean;
  } | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? collections.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q)
      )
    : collections;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">// Content</p>
          <h1 className="font-display text-3xl font-bold">Portfolio Collections</h1>
          <p className="mt-1 text-sm text-muted">
            หน้าผลงานรวม — แก้ไขหรือสร้างใหม่ แล้วลิงก์กับการ์ด Portfolio ได้
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <AdminSearch value={query} onChange={setQuery} placeholder="ค้นหา collection…" />
          <button
            onClick={() => setEditing({ collection: emptyCollection(), isNew: true })}
            className="btn-neon shrink-0 whitespace-nowrap"
          >
            + New Collection
          </button>
        </div>
      </div>

      {q && (
        <p className="mb-2 font-mono text-[11px] text-muted">
          พบ {filtered.length} จาก {collections.length} รายการ
        </p>
      )}

      <div className="glass divide-y divide-line/[0.06]">
        {collections.length > 0 && filtered.length === 0 && (
          <p className="p-6 font-mono text-sm text-muted">ไม่พบ collection ที่ตรงกับ “{query}”</p>
        )}
        {filtered.map((c) => {
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
                onClick={() => setEditing({ collection: c, isNew: false })}
                className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {editing && (
        <Editor
          collection={editing.collection}
          isNew={editing.isNew}
          portfolios={portfolios}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Editor({
  collection,
  isNew,
  portfolios,
  onClose,
}: {
  collection: PortfolioCollection;
  isNew: boolean;
  portfolios: PortfolioLink[];
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollJumpGuard(scrollRef);
  const [slug, setSlug] = useState(collection.slug);
  const [kind, setKind] = useState<"stories" | "groups">(
    collection.data.groups ? "groups" : "stories"
  );
  const [linkId, setLinkId] = useState(
    () =>
      portfolios.find((p) => p.project_url === `/portfolio/${collection.slug}`)
        ?.id ?? ""
  );
  const [title, setTitle] = useState(collection.title);
  const [tagline, setTagline] = useState(collection.tagline ?? "");
  const [intro, setIntro] = useState(collection.intro ?? "");
  const [category, setCategory] = useState(collection.category ?? "");
  const [tags, setTags] = useState((collection.tags ?? []).join(", "));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stories, setStories] = useState<Story[]>(() =>
    (collection.data.stories ?? []).map((s) => ({ ...s, _k: key() }))
  );
  const [groups, setGroups] = useState<Grp[]>(() =>
    (collection.data.groups ?? []).map((g) => ({
      ...g,
      _k: key(),
      events: g.events.map((e) => ({
        ...e,
        _k: key(),
        // Migrate a legacy single body into one sub-session so old events keep
        // their content and can gain more sessions.
        sessions: (e.sessions?.length
          ? e.sessions
          : hasContent(e.body)
          ? [{ title: "", body: e.body }]
          : []
        ).map((s) => ({ ...s, _k: key() })),
      })),
    }))
  );

  // Serialise (drop the internal _k keys).
  const payload = {
    title,
    tagline: tagline || null,
    intro: intro || null,
    category: category || null,
    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    data:
      kind === "stories"
        ? { stories: stories.map(({ _k, ...s }) => s) }
        : {
            groups: groups.map(({ _k, events, ...g }) => ({
              ...g,
              events: events.map(({ _k: _ek, sessions, body: _body, ...e }) => {
                const cleaned = sessions
                  .map(({ _k: _sk, ...s }) => s)
                  .filter(
                    (s) =>
                      // Keep stripped sessions (their body is hidden but real —
                      // restored server-side); drop only genuinely empty ones.
                      s._stripped ||
                      hasContent(s.body) ||
                      !!s.image ||
                      !!(s.title && s.title.trim()) ||
                      !!s.url
                  );
                return cleaned.length ? { ...e, sessions: cleaned } : e;
              }),
            })),
          },
  };

  return (
    <div ref={scrollRef} className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-space" onClick={onClose} />
      <form
        action={async (fd) => {
          setSaving(true);
          setSaveError(null);
          try {
            const res = await savePortfolioCollection(fd);
            if (res?.error) {
              setSaveError(res.error);
              return;
            }
            onClose();
          } catch (err) {
            // A thrown action (timeout, network drop) would otherwise fail
            // silently and look like "Save does nothing" — surface it instead.
            setSaveError(
              "บันทึกไม่สำเร็จ — อาจใช้เวลานานเกินไปหรือการเชื่อมต่อหลุด กรุณาลองอีกครั้ง" +
                (err instanceof Error ? ` (${err.message})` : "")
            );
          } finally {
            setSaving(false);
          }
        }}
        className="glass relative z-10 my-4 w-full max-w-2xl space-y-4 bg-space-light p-6"
      >
        <h2 className="font-display text-xl font-bold">
          {isNew ? "สร้าง Collection ใหม่" : `แก้ไข: ${collection.title}`}
        </h2>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />
        <input type="hidden" name="link_portfolio_id" value={linkId} />

        {isNew && (
          <div className="grid grid-cols-2 gap-4">
            <L l="Slug (URL, อังกฤษ/ตัวเลข)">
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="my-collection"
                className={field}
              />
            </L>
            <L l="ประเภท">
              <select value={kind} onChange={(e) => setKind(e.target.value as "stories" | "groups")} className={field}>
                <option value="stories" className="bg-space">รายการ (เหมือน Snobby)</option>
                <option value="groups" className="bg-space">กลุ่ม+งาน (เหมือน Insightist)</option>
              </select>
            </L>
          </div>
        )}

        <L l="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </L>
        <L l="Tagline (บรรทัดสั้น ใต้ชื่อ)">
          <textarea value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} className={`${field} resize-none`} />
        </L>
        <L l="Intro (rich text)">
          <RichTextEditor defaultValue={intro} onChange={setIntro} />
        </L>
        <div className="grid grid-cols-2 gap-4">
          <L l="Category">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={field} />
          </L>
          <L l="Tags (คั่นด้วย ,)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
          </L>
        </div>

        <div className="rounded-lg border border-cyan/25 bg-cyan/[0.04] p-3">
          <L l="🔗 ลิงก์กับการ์ด Portfolio (หน้าแรก)">
            <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className={field}>
              <option value="" className="bg-space">— ไม่ลิงก์ —</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id} className="bg-space">
                  {p.title}
                </option>
              ))}
            </select>
          </L>
          <p className="mt-1.5 font-mono text-[10px] text-muted">
            การ์ดที่เลือกจะเปิดหน้านี้ · URL: /portfolio/{slug || "…"}
          </p>
        </div>

        {kind === "stories" ? (
          <StoriesEditor stories={stories} setStories={setStories} />
        ) : (
          <GroupsEditor groups={groups} setGroups={setGroups} />
        )}

        {saveError && (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            ⚠ {saveError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-neon flex-1 disabled:opacity-60">
            {saving ? "กำลังบันทึก…" : "Save"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost disabled:opacity-60">
            Cancel
          </button>
          {!isNew && !DEFAULT_SLUGS.includes(slug) && (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`ลบ collection "${collection.title}" ?`)) return;
                const fd = new FormData();
                fd.set("slug", collection.slug);
                await deletePortfolioCollection(fd);
                onClose();
              }}
              className="font-mono text-xs uppercase tracking-wider text-red-400/70 hover:text-red-400"
            >
              ลบ
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ── Snobby Story: flat list of stories (rich-text detail) ──────────────────*/
function StoriesEditor({
  stories,
  setStories,
}: {
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
}) {
  const patch = (k: string, p: Partial<Story>) =>
    setStories((s) => s.map((x) => (x._k === k ? { ...x, ...p } : x)));
  const add = () =>
    setStories((s) => [...s, { _k: key(), title: "", detail: "", youtubeUrl: "" }]);
  const remove = (k: string) => setStories((s) => s.filter((x) => x._k !== k));
  const move = (k: string, d: number) =>
    setStories((s) => {
      const i = s.findIndex((x) => x._k === k);
      const j = i + d;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const a = [...s];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  return (
    <Section title="เรื่องราว (Stories)" onAdd={add} addLabel="＋ เพิ่มเรื่อง">
      {stories.map((s, i) => (
        <Card key={s._k} index={i} count={stories.length} onMove={(d) => move(s._k, d)} onRemove={() => remove(s._k)}>
          <input placeholder="ชื่อเรื่อง" value={s.title ?? ""} onChange={(e) => patch(s._k, { title: e.target.value })} className={field} />
          <div className="mt-2">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">รายละเอียด (rich text)</span>
            <RichTextEditor defaultValue={s.detail} onChange={(html) => patch(s._k, { detail: html })} />
          </div>
          <input placeholder="ลิงก์ YouTube (https://...)" value={s.youtubeUrl} onChange={(e) => patch(s._k, { youtubeUrl: e.target.value })} className={`${field} mt-2`} />
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g._k));
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g._k)));

  const patchG = (k: string, p: Partial<Grp>) =>
    setGroups((g) => g.map((x) => (x._k === k ? { ...x, ...p } : x)));
  const addG = () => setGroups((g) => [...g, { _k: key(), name: "", events: [] }]);
  const rmG = (k: string) => setGroups((g) => g.filter((x) => x._k !== k));
  const moveG = (k: string, d: number) =>
    setGroups((g) => {
      const i = g.findIndex((x) => x._k === k);
      const j = i + d;
      if (i < 0 || j < 0 || j >= g.length) return g;
      const a = [...g];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  return (
    <Section
      title="กลุ่ม & งาน (Groups)"
      onAdd={addG}
      addLabel="＋ เพิ่มกลุ่ม"
      extra={
        groups.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-cyan"
          >
            {allCollapsed ? "▾ ขยายทุกกลุ่ม" : "▸ ย่อทุกกลุ่ม"}
          </button>
        )
      }
    >
      {groups.map((g, gi) => (
        <Card
          key={g._k}
          index={gi}
          count={groups.length}
          onMove={(d) => moveG(g._k, d)}
          onRemove={() => rmG(g._k)}
          collapsed={collapsed.has(g._k)}
          onToggle={() => toggle(g._k)}
          summary={`${g.name || "(ยังไม่ตั้งชื่อกลุ่ม)"} · ${g.events.length} งาน`}
        >
          <input placeholder="ชื่อกลุ่ม" value={g.name} onChange={(e) => patchG(g._k, { name: e.target.value })} className={field} />
          <label className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted">
            <input type="checkbox" checked={!!g.popular} onChange={(e) => patchG(g._k, { popular: e.target.checked })} className="accent-cyan" />
            กลุ่มยอดนิยม (★ ไม่นับรวมจำนวนงาน)
          </label>
          <EventsEditor events={g.events} setEvents={(events) => patchG(g._k, { events })} />
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
  // Existing events start collapsed (compact title list); newly-added events
  // have fresh keys not in the set, so they open ready to edit.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(events.map((e) => e._k))
  );
  const toggle = (k: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const patch = (k: string, p: Partial<Ev>) =>
    setEvents(events.map((x) => (x._k === k ? { ...x, ...p } : x)));
  const add = () =>
    setEvents([...events, { _k: key(), title: "", url: "", image: "", sessions: [] }]);
  const remove = (k: string) => setEvents(events.filter((x) => x._k !== k));
  const move = (k: string, d: number) => {
    const i = events.findIndex((x) => x._k === k);
    const j = i + d;
    if (i < 0 || j < 0 || j >= events.length) return;
    const a = [...events];
    [a[i], a[j]] = [a[j], a[i]];
    setEvents(a);
  };

  return (
    <div className="mt-3 space-y-2 border-l border-line/10 pl-3">
      {events.map((e, i) => {
        const isCollapsed = collapsed.has(e._k);
        return (
        <div key={e._k} className="rounded-md border border-line/10 bg-surface/[0.02] p-2">
          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
            <button type="button" onClick={() => toggle(e._k)} className="flex min-w-0 items-center gap-1.5 hover:text-cyan">
              <span className="text-cyan">{isCollapsed ? "▸" : "▾"}</span>
              <span className="shrink-0">งานที่ {i + 1}</span>
              {isCollapsed && <span className="truncate text-ink/70">{e.title || "(ยังไม่ตั้งชื่อ)"}</span>}
            </button>
            <span className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => move(e._k, -1)} className="hover:text-cyan">↑</button>
              <button type="button" onClick={() => move(e._k, 1)} className="hover:text-cyan">↓</button>
              <button type="button" onClick={() => remove(e._k)} className="text-red-400/70 hover:text-red-400">− ลบ</button>
            </span>
          </div>
          {!isCollapsed && (
          <div className="mt-2">
          <input placeholder="ชื่องาน" value={e.title} onChange={(ev) => patch(e._k, { title: ev.target.value })} className={field} />
          <input placeholder="ลิงก์ Facebook (https://...)" value={e.url} onChange={(ev) => patch(e._k, { url: ev.target.value })} className={`${field} mt-1.5`} />
          <UploadImageField className="mt-1.5" value={e.image ?? ""} onChange={(url) => patch(e._k, { image: url })} />
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <input type="number" min="0" inputMode="numeric" placeholder="❤️ รีแอก" value={e.metrics?.reactions ?? ""}
              onChange={(ev) => patch(e._k, { metrics: { ...e.metrics, reactions: numOrUndef(ev.target.value) } })} className={field} />
            <input type="number" min="0" inputMode="numeric" placeholder="💬 คอมเมนต์" value={e.metrics?.comments ?? ""}
              onChange={(ev) => patch(e._k, { metrics: { ...e.metrics, comments: numOrUndef(ev.target.value) } })} className={field} />
            <input type="number" min="0" inputMode="numeric" placeholder="🔄 แชร์" value={e.metrics?.shares ?? ""}
              onChange={(ev) => patch(e._k, { metrics: { ...e.metrics, shares: numOrUndef(ev.target.value) } })} className={field} />
          </div>
          <SubSessionsEditor event={e} patch={patch} />
          </div>
          )}
        </div>
        );
      })}
      <button type="button" onClick={add} className="rounded-md border border-cyan/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-cyan/80 hover:bg-cyan/10">
        ＋ เพิ่มงาน
      </button>
    </div>
  );
}

/* ── Sub-sessions (sub-blogs) inside one event → carousel on its page ────────*/
function SubSessionsEditor({
  event,
  patch,
}: {
  event: Ev;
  patch: (k: string, p: Partial<Ev>) => void;
}) {
  const sessions = event.sessions;
  const setSessions = (s: Sess[]) => patch(event._k, { sessions: s });
  const patchS = (sk: string, p: Partial<Sess>) =>
    setSessions(sessions.map((x) => (x._k === sk ? { ...x, ...p } : x)));
  const addS = () =>
    patch(event._k, {
      sessions: [...sessions, { _k: key(), title: "", body: "", image: "", url: "" }],
      // Ensure the event has a slug so its carousel page is reachable.
      slug: event.slug || slugify(event.title) || `event-${Date.now().toString(36)}`,
    });
  const rmS = (sk: string) => setSessions(sessions.filter((x) => x._k !== sk));
  const moveS = (sk: string, d: number) => {
    const i = sessions.findIndex((x) => x._k === sk);
    const j = i + d;
    if (i < 0 || j < 0 || j >= sessions.length) return;
    const a = [...sessions];
    [a[i], a[j]] = [a[j], a[i]];
    setSessions(a);
  };

  return (
    <div className="mt-2 rounded-md border border-cyan/15 bg-cyan/[0.03] p-2.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-cyan/80">
        Session ย่อย (Blog) — เลื่อนดูแบบ Carousel ในหน้างาน
      </span>

      {sessions.length > 0 && (
        <>
          <input
            placeholder="slug (ลิงก์หน้างาน)"
            value={event.slug ?? ""}
            onChange={(ev) => patch(event._k, { slug: ev.target.value })}
            className={`${field} mt-2`}
          />
          <p className="mb-1 mt-1 font-mono text-[10px] text-muted">
            /portfolio/insightist/{event.slug || "…"}
          </p>
        </>
      )}

      <div className="mt-1 space-y-2">
        {sessions.map((s, si) => (
          <div key={s._k} className="rounded border border-line/10 bg-surface/[0.03] p-2">
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted">
              <span>Session ย่อยที่ {si + 1}</span>
              <span className="flex gap-1.5">
                <button type="button" onClick={() => moveS(s._k, -1)} className="hover:text-cyan">↑</button>
                <button type="button" onClick={() => moveS(s._k, 1)} className="hover:text-cyan">↓</button>
                <button type="button" onClick={() => rmS(s._k)} className="text-red-400/70 hover:text-red-400">− ลบ</button>
              </span>
            </div>
            <input placeholder="ชื่อ session ย่อย" value={s.title ?? ""} onChange={(ev) => patchS(s._k, { title: ev.target.value })} className={field} />
            <UploadImageField className="mt-1.5" value={s.image ?? ""} onChange={(url) => patchS(s._k, { image: url })} />
            <input placeholder="ลิงก์ Facebook (ไม่บังคับ)" value={s.url ?? ""} onChange={(ev) => patchS(s._k, { url: ev.target.value })} className={`${field} mt-1.5`} />
            <div className="mt-1.5">
              <RichTextEditor defaultValue={s.body} onChange={(html) => patchS(s._k, { body: html })} />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addS}
        className="mt-2 rounded-md border border-cyan/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-cyan/80 hover:bg-cyan/10"
      >
        ＋ เพิ่ม session ย่อย (Blog)
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
  extra,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line/10 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-cyan/80">{title}</p>
        {extra}
      </div>
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
  collapsed,
  onToggle,
  summary,
}: {
  index: number;
  count: number;
  onMove: (d: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  summary?: string;
}) {
  return (
    <div className="rounded-lg border border-line/10 bg-surface/[0.03] p-3">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
        {onToggle ? (
          <button type="button" onClick={onToggle} className="flex min-w-0 items-center gap-2 hover:text-cyan">
            <span className="text-cyan">{collapsed ? "▸" : "▾"}</span>
            <span className="shrink-0">#{index + 1}</span>
            {collapsed && summary && (
              <span className="truncate normal-case tracking-normal text-ink/70">{summary}</span>
            )}
          </button>
        ) : (
          <span>#{index + 1}</span>
        )}
        <span className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="disabled:opacity-30 hover:text-cyan">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className="disabled:opacity-30 hover:text-cyan">↓</button>
          <button type="button" onClick={onRemove} className="text-red-400/70 hover:text-red-400">− ลบ</button>
        </span>
      </div>
      {!collapsed && <div className="mt-2">{children}</div>}
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

/* ── Controlled image field: paste a URL or upload (compressed) a file ───────*/
function UploadImageField({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr(null);
    // Compress in the browser first so big photos stay under the upload limit.
    const upload = await compressImage(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", upload);
    fd.append("bucket", "portfolio-images");
    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.publicUrl) setErr(data.error || "อัปโหลดไม่สำเร็จ");
      else onChange(data.publicUrl);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    }
    setBusy(false);
  }

  return (
    <div className={className}>
      <div className="flex gap-1.5">
        <input
          placeholder="ลิงก์รูป (ไม่บังคับ)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 font-mono text-[11px] uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
        >
          {busy ? "…" : "⬆ อัป"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      {value && (
        <div className="mt-1.5 h-16 w-24 overflow-hidden rounded border border-line/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      {err && <p className="mt-1 font-mono text-[10px] text-red-400">⚠ {err}</p>}
    </div>
  );
}
