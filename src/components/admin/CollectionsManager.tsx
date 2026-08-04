"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  savePortfolioCollection,
  deletePortfolioCollection,
  getEventSessions,
  saveEvent,
  deleteEvent,
  saveCollectionMeta,
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
type Sess = { _k: string; title?: string; image?: string; body?: string; url?: string };
type Ev = {
  _k: string;
  title: string;
  url: string;
  image?: string;
  body?: string;
  slug?: string;
  metrics?: CollectionEventMetrics;
  sessions: Sess[];
  // Editor-only bookkeeping (never persisted):
  _new?: boolean; // added this session — has no DB row yet
  _dirty?: boolean; // content edited — needs a saveEvent on Save
  _loaded?: boolean; // its sessions have been fetched (or it's new)
  _origSlug?: string; // slug at load time — to rename (drop old) on Save
};
type Grp = { _k: string; name: string; popular?: boolean; events: Ev[] };

/** True if a (new) event carries nothing worth persisting. */
const isEmptyEvent = (e: Ev) =>
  !e.title?.trim() &&
  !e.url?.trim() &&
  !e.image?.trim() &&
  !(e.sessions ?? []).some(
    (s) => hasContent(s.body) || !!s.image || !!(s.title && s.title.trim()) || !!s.url
  );

/** Build editor state (with stable _k keys) from stored group data, migrating a
 *  legacy single event body into one sub-session. Events arrive LIGHT (no session
 *  bodies) for existing collections — their sessions are lazy-loaded on expand. */
function toGroupsState(dataGroups: PortfolioCollection["data"]["groups"]): Grp[] {
  return (dataGroups ?? []).map((g) => ({
    ...g,
    _k: key(),
    events: g.events.map((e) => {
      const inline = e.sessions?.length
        ? e.sessions
        : hasContent(e.body)
        ? [{ title: "", body: e.body }]
        : [];
      return {
        ...e,
        _k: key(),
        _origSlug: e.slug,
        _loaded: inline.length > 0, // light events (no inline sessions) load on expand
        sessions: inline.map((s) => ({ ...s, _k: key() })),
      };
    }),
  }));
}

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
  const router = useRouter();
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
  const [groups, setGroups] = useState<Grp[]>(() => toGroupsState(collection.data.groups));

  // Existing grouped collections edit PER EVENT: the listing is loaded light
  // (no session bodies), each event's sessions are fetched on expand, and Save
  // writes one event at a time + the structure — so it scales to any size and
  // never round-trips a multi-MB blob. New collections + stories still save whole
  // (they're small).
  const perEvent = kind === "groups" && !isNew;

  /** Whole-collection payload — used for stories + brand-new collections only. */
  function buildWholePayload() {
    return {
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
                events: events
                  .filter((e) => !isEmptyEvent(e))
                  .map(
                    ({ _k: _ek, _new, _dirty, _loaded, _origSlug, sessions, body: _b, ...e }) => ({
                      ...e,
                      sessions: (sessions ?? [])
                        .map(({ _k: _sk, ...s }) => s)
                        .filter(
                          (s) =>
                            hasContent(s.body) ||
                            !!s.image ||
                            !!(s.title && s.title.trim()) ||
                            !!s.url
                        ),
                    })
                  ),
              })),
            },
    };
  }

  async function saveWhole() {
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("payload", JSON.stringify(buildWholePayload()));
    fd.set("link_portfolio_id", linkId);
    const res = await savePortfolioCollection(fd);
    if (res?.error) {
      setSaveError(res.error);
      return false;
    }
    return true;
  }

  async function savePerEvent() {
    // Work on a shallow copy so we can capture server-assigned slugs.
    const working = groups.map((g) => ({ ...g, events: g.events.filter((e) => !isEmptyEvent(e)) }));

    // 1) Save each new/edited event's content, one at a time.
    for (const g of working) {
      for (let i = 0; i < g.events.length; i++) {
        const e = g.events[i];
        if (!(e._new || e._dirty)) continue;
        const fd = new FormData();
        fd.set("collection_slug", slug);
        fd.set(
          "payload",
          JSON.stringify({
            origSlug: e._new ? null : e._origSlug ?? e.slug ?? null,
            slug: e.slug || "",
            group_name: g.name,
            event_order: i,
            title: e.title,
            url: e.url || null,
            image: e.image || null,
            metrics: e.metrics ?? null,
            sessions: (e.sessions ?? []).map(({ _k, ...s }) => s),
          })
        );
        const res = await saveEvent(fd);
        if (res.error || !res.slug) {
          setSaveError(res.error ?? "บันทึกงานไม่สำเร็จ");
          return false;
        }
        g.events[i] = { ...e, slug: res.slug, _origSlug: res.slug, _new: false, _dirty: false };
      }
    }

    // 2) Save header + group metadata + event structure (group + order).
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("link_portfolio_id", linkId);
    fd.set(
      "payload",
      JSON.stringify({
        title,
        tagline: tagline || null,
        intro: intro || null,
        category: category || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        groups: working.map((g) => ({
          name: g.name,
          popular: !!g.popular,
          eventSlugs: g.events.map((e) => e.slug).filter(Boolean) as string[],
        })),
      })
    );
    const res = await saveCollectionMeta(fd);
    if (res.error) {
      setSaveError(res.error);
      return false;
    }
    setGroups(working); // reflect server-assigned slugs / cleared dirty flags
    return true;
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const ok = perEvent ? await savePerEvent() : await saveWhole();
      if (ok) {
        router.refresh();
        onClose();
      }
    } catch (err) {
      // A thrown action (timeout, network drop) would otherwise fail silently and
      // look like "Save does nothing" — surface it instead.
      setSaveError(
        "บันทึกไม่สำเร็จ — อาจใช้เวลานานเกินไปหรือการเชื่อมต่อหลุด กรุณาลองอีกครั้ง" +
          (err instanceof Error ? ` (${err.message})` : "")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-space" onClick={onClose} />
      <form
        onSubmit={(e) => e.preventDefault()}
        className="glass relative z-10 my-4 w-full max-w-2xl space-y-4 bg-space-light p-6"
      >
        <h2 className="font-display text-xl font-bold">
          {isNew ? "สร้าง Collection ใหม่" : `แก้ไข: ${collection.title}`}
        </h2>

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
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "stories" | "groups")}
                className={field}
              >
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
          <textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            rows={2}
            className={`${field} resize-none`}
          />
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

        {perEvent && (
          <p className="rounded-md border border-cyan/20 bg-cyan/[0.04] px-3 py-2 font-mono text-[10px] text-cyan/80">
            💡 กางงานที่ต้องการแก้ (ระบบจะโหลดเนื้อหาเฉพาะงานนั้น) · กด Save เพื่อบันทึกงานที่แก้ + ลำดับ/กลุ่ม · ปุ่ม “ลบ” ในแต่ละงานจะลบทันที
          </p>
        )}

        {kind === "stories" ? (
          <StoriesEditor stories={stories} setStories={setStories} />
        ) : (
          <GroupsEditor
            groups={groups}
            setGroups={setGroups}
            perEvent={perEvent}
            collectionSlug={slug}
          />
        )}

        {saveError && (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            ⚠ {saveError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-neon flex-1 disabled:opacity-60"
          >
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
                router.refresh();
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
  perEvent,
  collectionSlug,
}: {
  groups: Grp[];
  setGroups: React.Dispatch<React.SetStateAction<Grp[]>>;
  perEvent: boolean;
  collectionSlug: string;
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

  const patchG = (k: string, p: Partial<Grp> | ((g: Grp) => Partial<Grp>)) =>
    setGroups((g) =>
      g.map((x) => (x._k === k ? { ...x, ...(typeof p === "function" ? p(x) : p) } : x))
    );
  const addG = () => setGroups((g) => [...g, { _k: key(), name: "", events: [] }]);
  const rmG = (k: string) =>
    setGroups((g) => {
      const grp = g.find((x) => x._k === k);
      if (grp && grp.events.length) {
        window.alert("ลบกลุ่มไม่ได้ — ต้องย้ายหรือลบงานในกลุ่มนี้ให้หมดก่อน");
        return g;
      }
      return g.filter((x) => x._k !== k);
    });
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
          <EventsEditor
            events={g.events}
            updateEvents={(fn) => patchG(g._k, (grp) => ({ events: fn(grp.events) }))}
            perEvent={perEvent}
            collectionSlug={collectionSlug}
          />
        </Card>
      ))}
    </Section>
  );
}

function EventsEditor({
  events,
  updateEvents,
  perEvent,
  collectionSlug,
}: {
  events: Ev[];
  // Functional updater so concurrent edits (typing while other editors fire
  // their own state updates) never clobber each other via a stale closure.
  updateEvents: (fn: (evs: Ev[]) => Ev[]) => void;
  perEvent: boolean;
  collectionSlug: string;
}) {
  // Existing events start collapsed (compact title list); newly-added events
  // have fresh keys not in the set, so they open ready to edit.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(events.map((e) => e._k))
  );
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());

  // Edit patch — marks the event dirty (needs saveEvent).
  const patch = (k: string, p: Partial<Ev> | ((e: Ev) => Partial<Ev>)) =>
    updateEvents((evs) =>
      evs.map((x) => (x._k === k ? { ...x, ...(typeof p === "function" ? p(x) : p), _dirty: true } : x))
    );
  // Raw patch — used for lazy-loading sessions; must NOT mark dirty.
  const rawPatch = (k: string, p: Partial<Ev>) =>
    updateEvents((evs) => evs.map((x) => (x._k === k ? { ...x, ...p } : x)));

  async function openEvent(e: Ev) {
    const wasCollapsed = collapsed.has(e._k);
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(e._k)) n.delete(e._k);
      else n.add(e._k);
      return n;
    });
    if (!wasCollapsed || !perEvent || e._new || e._loaded || loadingKeys.has(e._k)) return;
    setLoadingKeys((s) => new Set(s).add(e._k));
    const res = await getEventSessions(collectionSlug, e._origSlug ?? e.slug ?? "");
    rawPatch(e._k, {
      sessions: (res.sessions ?? []).map((s) => ({ ...s, _k: key() })),
      _loaded: true,
    });
    setLoadingKeys((s) => {
      const n = new Set(s);
      n.delete(e._k);
      return n;
    });
  }

  const add = () =>
    updateEvents((evs) => [
      ...evs,
      { _k: key(), title: "", url: "", image: "", sessions: [], _new: true, _loaded: true },
    ]);

  async function remove(k: string) {
    const e = events.find((x) => x._k === k);
    if (perEvent && e && !e._new && (e._origSlug || e.slug)) {
      if (!window.confirm(`ลบงาน "${e.title || "(ยังไม่ตั้งชื่อ)"}" ? (ลบทันที กู้คืนไม่ได้)`)) return;
      const res = await deleteEvent(collectionSlug, e._origSlug ?? e.slug ?? "");
      if (res.error) {
        window.alert("ลบไม่สำเร็จ: " + res.error);
        return;
      }
    }
    updateEvents((evs) => evs.filter((x) => x._k !== k));
  }

  const move = (k: string, d: number) =>
    updateEvents((evs) => {
      const i = evs.findIndex((x) => x._k === k);
      const j = i + d;
      if (i < 0 || j < 0 || j >= evs.length) return evs;
      const a = [...evs];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  return (
    <div className="mt-3 space-y-2 border-l border-line/10 pl-3">
      {events.map((e, i) => {
        const isCollapsed = collapsed.has(e._k);
        const isLoading = loadingKeys.has(e._k);
        return (
          <div key={e._k} className="rounded-md border border-line/10 bg-surface/[0.02] p-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <button type="button" onClick={() => openEvent(e)} className="flex min-w-0 items-center gap-1.5 hover:text-cyan">
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
            {!isCollapsed &&
              (isLoading ? (
                <p className="mt-2 py-3 text-center font-mono text-[11px] text-cyan/70">⏳ กำลังโหลดเนื้อหางานนี้…</p>
              ) : (
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
              ))}
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
  patch: (k: string, p: Partial<Ev> | ((e: Ev) => Partial<Ev>)) => void;
}) {
  const sessions = event.sessions;
  // Functional updates so a body typed into a freshly-added session can't be
  // dropped by another editor's concurrent (stale-closure) state write.
  const updateSessions = (fn: (ss: Sess[]) => Sess[]) =>
    patch(event._k, (ev) => ({ sessions: fn(ev.sessions ?? []) }));
  const patchS = (sk: string, p: Partial<Sess>) =>
    updateSessions((ss) => ss.map((x) => (x._k === sk ? { ...x, ...p } : x)));
  const addS = () =>
    patch(event._k, (ev) => ({
      sessions: [...(ev.sessions ?? []), { _k: key(), title: "", body: "", image: "", url: "" }],
      // Ensure the event has a slug so its carousel page is reachable.
      slug: ev.slug || slugify(ev.title) || `event-${Date.now().toString(36)}`,
    }));
  const rmS = (sk: string) => updateSessions((ss) => ss.filter((x) => x._k !== sk));
  const moveS = (sk: string, d: number) =>
    updateSessions((ss) => {
      const i = ss.findIndex((x) => x._k === sk);
      const j = i + d;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const a = [...ss];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

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
