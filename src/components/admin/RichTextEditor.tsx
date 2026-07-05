"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { Figure } from "./figure-extension";
import { Embed } from "./embed-extension";
import { parseEmbed } from "@/lib/embed";

interface Props {
  /** Form field name — if set, submits the resulting HTML via a hidden input. */
  name?: string;
  defaultValue?: string;
  /** Called with the HTML whenever it changes (for state-based forms). */
  onChange?: (html: string) => void;
}

/**
 * Split blocks on runs of 2+ consecutive <br> (paragraph-intent breaks) into
 * separate blocks of the same tag. Older content sometimes stored two visual
 * paragraphs inside a single node (e.g. <h4>a<br><br>b</h4>), which made a
 * heading change affect both at once. Single <br> soft breaks are preserved.
 */
function splitDoubleBreaks(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6").forEach((block) => {
    if (block.querySelectorAll("br").length < 2) return;

    const groups: Node[][] = [[]];
    let run: Node[] = [];
    const flush = () => {
      if (run.length >= 2) {
        if (groups[groups.length - 1].length) groups.push([]);
      } else {
        run.forEach((br) => groups[groups.length - 1].push(br));
      }
      run = [];
    };
    block.childNodes.forEach((node) => {
      if (node.nodeName === "BR") run.push(node);
      else {
        flush();
        groups[groups.length - 1].push(node);
      }
    });
    flush();

    const built = groups
      .filter((g) =>
        g.some((n) => (n.textContent && n.textContent.trim()) || n.nodeName === "IMG")
      )
      .map((g) => {
        const el = doc.createElement(block.tagName);
        const style = block.getAttribute("style");
        if (style) el.setAttribute("style", style);
        g.forEach((n) => el.appendChild(n.cloneNode(true)));
        return el;
      });

    if (built.length > 1) {
      const frag = doc.createDocumentFragment();
      built.forEach((el) => frag.appendChild(el));
      block.replaceWith(frag);
    }
  });
  return doc.body.innerHTML;
}

/**
 * Emoji copied from Facebook (and many sites/editors) arrive as <img> tags, not
 * text. The Image extension then inserts them as full-width block images, so a
 * single 👍 balloons into a giant blurry picture. Convert any emoji-image back
 * to its Unicode character on paste, so it renders inline at text size — the way
 * it looks on Facebook. Real images (with descriptive alt text) are untouched.
 */
// Pictographic glyphs plus the joiners/modifiers that build compound emoji:
// Emoji_Component already covers ZWJ, variation selectors, keycaps and skin tones.
const EMOJI_ONLY =
  /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;
const HAS_PICTOGRAPH = /\p{Extended_Pictographic}/u;

function transformPastedHTML(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.body.querySelectorAll("img").forEach((img) => {
    const label = (
      img.getAttribute("alt") ||
      img.getAttribute("aria-label") ||
      ""
    ).trim();
    // Only convert when the label is purely emoji (a pictographic glyph and
    // nothing else) — that's an emoji, not a captioned photo.
    if (label && HAS_PICTOGRAPH.test(label) && EMOJI_ONLY.test(label)) {
      img.replaceWith(doc.createTextNode(label));
    }
  });
  return doc.body.innerHTML;
}

/**
 * WYSIWYG body editor (TipTap). Paragraphs, H1–H6, bold/italic, lists, quote,
 * left/center/right alignment, links (wrap selected text), and images with an
 * optional caption — placed as blocks between paragraphs. Outputs clean HTML
 * into a hidden input so the saveBlog server action keeps reading `body`.
 */
export default function RichTextEditor({ name, defaultValue = "", onChange }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [, setTick] = useState(0); // refresh toolbar active states on selection
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Keep the latest onChange so the editor's create/update callbacks (captured
  // once) always call the current prop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Heal legacy "two paragraphs merged into one node via <br><br>" content so
  // each paragraph is an independent block (client-only; SSR passes it through).
  const initialHtml = useMemo(
    () => splitDoubleBreaks(defaultValue) || "<p></p>",
    [defaultValue]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false, // don't navigate while editing
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "blog-img" },
      }),
      Figure,
      Embed,
      TableKit.configure({
        table: { resizable: true, HTMLAttributes: { class: "blog-table" } },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialHtml,
    immediatelyRender: false, // required for Next.js SSR
    // Sync the hidden input to the normalised HTML on load, so re-saving an
    // untouched post persists the split-paragraph fix.
    onCreate: ({ editor }) => {
      const h = editor.getHTML();
      setHtml(h);
      onChangeRef.current?.(h);
    },
    onUpdate: ({ editor }) => {
      const h = editor.getHTML();
      setHtml(h);
      onChangeRef.current?.(h);
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    editorProps: {
      // Turn pasted emoji-images (👍 from Facebook etc.) back into text so they
      // render inline at normal size instead of full-width block pictures.
      transformPastedHTML,
      attributes: {
        class:
          "prose-cyber max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
      // Inside a table, clicking/editing a cell made ProseMirror scroll the
      // selection into view and jump the modal to the top. Suppress that
      // programmatic scroll for table selections (the caret is already where
      // the user clicked; the browser still keeps it visible while typing).
      handleScrollToSelection: (view) => {
        const { $head } = view.state.selection;
        for (let d = $head.depth; d > 0; d--) {
          if ($head.node(d).type.spec.tableRole) return true;
        }
        return false;
      },
    },
  });

  // Clicking into the editor (notably a table cell) makes the browser scroll
  // the freshly-focused editable to the top of its scroll container, jumping
  // the modal up to the toolbar. Record the scroll position on mousedown and
  // snap it back on the next frame (before paint) so there is no visible jump.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const scrollParent = (node: HTMLElement | null): HTMLElement | null => {
      let p = node?.parentElement ?? null;
      while (p) {
        const oy = getComputedStyle(p).overflowY;
        if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
        p = p.parentElement;
      }
      return (document.scrollingElement as HTMLElement) ?? null;
    };
    // Record the scroll position on mousedown (before the browser focuses and
    // scrolls) and snap it back over the next couple of frames. Only touches
    // scrollTop — never focus or selection — so the caret still lands where the
    // user clicked.
    const onDown = () => {
      const sp = scrollParent(dom);
      if (!sp) return;
      const top = sp.scrollTop;
      const restore = () => {
        if (Math.abs(sp.scrollTop - top) > 1) sp.scrollTop = top;
      };
      requestAnimationFrame(restore);
      requestAnimationFrame(() => requestAnimationFrame(restore));
    };
    dom.addEventListener("mousedown", onDown, true);
    return () => dom.removeEventListener("mousedown", onDown, true);
  }, [editor]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !editor) return;

    setUploading(true);
    setErr(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "blog-images");

    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.publicUrl) {
        setErr(data.error || "Upload failed");
      } else {
        // Insert a captioned figure, then a paragraph to keep typing.
        editor
          .chain()
          .focus()
          .insertContent([
            { type: "figure", attrs: { src: data.publicUrl, alt: file.name } },
            { type: "paragraph" },
          ])
          .run();
      }
    } catch {
      setErr("Upload failed");
    }
    setUploading(false);
  }

  return (
    <div>
      {name && <input type="hidden" name={name} value={html} />}
      <div className="overflow-hidden rounded-lg border border-line/10 bg-surface/[0.03]">
        <Toolbar
          editor={editor}
          uploading={uploading}
          onImage={() => fileRef.current?.click()}
        />
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {err && <p className="mt-1 font-mono text-[11px] text-red-400">⚠ {err}</p>}
      <p className="mt-1 font-mono text-[10px] text-muted">
        🔗 แนบลิงก์ · จัดวางซ้าย/กลาง/ขวา · 🖼 รูป+คำอธิบาย · ▶ ฝังวิดีโอ/โซเชียล · ▦ ตาราง (กดในตารางเพื่อเพิ่ม/ลบแถว-คอลัมน์ · ลากขอบเพื่อปรับกว้าง)
      </p>
    </div>
  );
}

function Toolbar({
  editor,
  uploading,
  onImage,
}: {
  editor: Editor | null;
  uploading: boolean;
  onImage: () => void;
}) {
  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    label,
    title,
    disabled,
  }: {
    onClick: () => void;
    active?: boolean;
    label: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-w-8 items-center justify-center rounded px-2 py-1 font-mono text-xs transition-colors disabled:opacity-50 ${
        active
          ? "bg-cyan/20 text-cyan"
          : "text-muted hover:bg-surface/[0.06] hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  // Current block type for the format dropdown.
  let block = "p";
  for (let l = 1; l <= 6; l++) {
    if (editor.isActive("heading", { level: l })) block = `h${l}`;
  }
  const setBlock = (v: string) => {
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  };

  const setLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (editor.state.selection.empty) {
      window.alert("เลือกข้อความที่จะแนบลิงก์ก่อน");
      return;
    }
    const url = window.prompt("วางลิงก์ (URL):", "https://");
    if (url === null) return; // cancelled
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertEmbed = () => {
    const raw = window.prompt(
      "วางลิงก์ YouTube / Vimeo / Spotify / X / TikTok:",
      "https://"
    );
    if (raw === null) return;
    const parsed = parseEmbed(raw);
    if (!parsed) {
      window.alert(
        "ลิงก์นี้ยังไม่รองรับ\nรองรับ: YouTube, Vimeo, Spotify, X (Twitter), TikTok"
      );
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "embed", attrs: { provider: parsed.provider, src: parsed.src, url: parsed.url } },
        { type: "paragraph" },
      ])
      .run();
  };

  const inTable = editor.isActive("table");

  return (
    <div className="relative border-b border-line/10 bg-surface/[0.03]">
      <div className="flex flex-wrap items-center gap-1 p-2">
        <select
          title="รูปแบบข้อความ"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
          className="rounded bg-surface/[0.06] px-2 py-1 font-mono text-xs text-ink outline-none"
        >
          <option value="p" className="bg-space">ย่อหน้า</option>
          <option value="h1" className="bg-space">H1</option>
          <option value="h2" className="bg-space">H2</option>
          <option value="h3" className="bg-space">H3</option>
          <option value="h4" className="bg-space">H4</option>
          <option value="h5" className="bg-space">H5</option>
          <option value="h6" className="bg-space">H6</option>
        </select>
        <span className="mx-1 h-4 w-px bg-line/15" />

        <Btn title="ตัวหนา (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label={<b>B</b>} />
        <Btn title="ตัวเอียง (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label={<i>I</i>} />
        <Btn title="แนบลิงก์ / ยกเลิกลิงก์" active={editor.isActive("link")} onClick={setLink} label="🔗" />
        <span className="mx-1 h-4 w-px bg-line/15" />

        <Btn title="ชิดซ้าย" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} label={<AlignIcon dir="left" />} />
        <Btn title="กึ่งกลาง" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} label={<AlignIcon dir="center" />} />
        <Btn title="ชิดขวา" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} label={<AlignIcon dir="right" />} />
        <span className="mx-1 h-4 w-px bg-line/15" />

        <Btn title="รายการจุด" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="• List" />
        <Btn title="รายการเลข" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1. List" />
        <Btn title="ข้อความอ้างอิง" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝" />
        <span className="mx-1 h-4 w-px bg-line/15" />

        <Btn title="แทรกรูปภาพ (อัปโหลด) + ใส่คำอธิบายได้" disabled={uploading} onClick={onImage} label={uploading ? "⏳ …" : "🖼 รูป"} />
        <Btn title="ฝังวิดีโอ/โซเชียล (YouTube, Vimeo, Spotify, X, TikTok)" onClick={insertEmbed} label="▶ ฝัง" />
        <Btn
          title="แทรกตาราง 3×3"
          active={inTable}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          label="▦ ตาราง"
        />
      </div>

      {inTable && (
        <div className="absolute inset-x-0 top-full z-20 flex flex-wrap items-center gap-1 border-b border-line/10 bg-space-light px-2 py-1.5 shadow-lg shadow-black/40">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-cyan/80">
            ▦ ตาราง
          </span>
          <Btn title="เพิ่มคอลัมน์" onClick={() => editor.chain().focus().addColumnAfter().run()} label="+ คอลัมน์" />
          <Btn title="ลบคอลัมน์" onClick={() => editor.chain().focus().deleteColumn().run()} label="− คอลัมน์" />
          <span className="mx-1 h-4 w-px bg-line/15" />
          <Btn title="เพิ่มแถว" onClick={() => editor.chain().focus().addRowAfter().run()} label="+ แถว" />
          <Btn title="ลบแถว" onClick={() => editor.chain().focus().deleteRow().run()} label="− แถว" />
          <span className="mx-1 h-4 w-px bg-line/15" />
          <Btn title="สลับหัวตาราง (แถว)" onClick={() => editor.chain().focus().toggleHeaderRow().run()} label="หัวแถว" />
          <Btn title="รวม/แยกช่อง" onClick={() => editor.chain().focus().mergeOrSplit().run()} label="รวม/แยก" />
          <span className="mx-1 h-4 w-px bg-line/15" />
          <Btn title="ลบตารางทั้งหมด" onClick={() => editor.chain().focus().deleteTable().run()} label="🗑 ลบตาราง" />
        </div>
      )}
    </div>
  );
}

function AlignIcon({ dir }: { dir: "left" | "center" | "right" }) {
  const lines: Record<typeof dir, [number, number][]> = {
    left: [
      [3, 21],
      [3, 15],
      [3, 18],
    ],
    center: [
      [3, 21],
      [6, 18],
      [5, 19],
    ],
    right: [
      [3, 21],
      [9, 21],
      [6, 21],
    ],
  };
  const rows = [6, 12, 18];
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {lines[dir].map(([x1, x2], i) => (
        <line key={i} x1={x1} y1={rows[i]} x2={x2} y2={rows[i]} />
      ))}
    </svg>
  );
}
