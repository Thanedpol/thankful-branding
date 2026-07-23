"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { Figure } from "./figure-extension";
import { Gallery } from "./gallery-extension";
import { Embed } from "./embed-extension";
import { parseEmbed } from "@/lib/embed";
import { compressImage } from "@/lib/compress-image";
import { inlineEmojiImages } from "@/lib/portfolio-sessions";

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
// Emoji_Component covers ZWJ, variation selectors, keycaps, skin tones and the
// regional indicators that build flags.
const EMOJI_ONLY =
  /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;
// At least one real emoji: a pictograph, or a flag (regional indicators) —
// flags carry no pictographic glyph, which is why 🇹🇭 slipped through before.
const HAS_EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u;

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
    if (label && HAS_EMOJI.test(label) && EMOJI_ONLY.test(label)) {
      img.replaceWith(doc.createTextNode(label));
    }
  });
  return doc.body.innerHTML;
}

/** First image file in a clipboard/drag payload, or null if there isn't one. */
function imageFromDataTransfer(dt: DataTransfer | null): File | null {
  const files = dt?.files;
  if (!files || !files.length) return null;
  return Array.from(files).find((f) => f.type.startsWith("image/")) ?? null;
}

/**
 * WYSIWYG body editor (TipTap). Paragraphs, H1–H6, bold/italic, lists, quote,
 * left/center/right alignment, links (wrap selected text), and images with an
 * optional caption — placed as blocks between paragraphs. Outputs clean HTML
 * into a hidden input so the saveBlog server action keeps reading `body`.
 */
export default function RichTextEditor({ name, defaultValue = "", onChange }: Props) {
  // The hidden <input name={name}> that carries the body into the form. We
  // write the editor HTML straight to its DOM value (via this ref) on every
  // change — synchronously — instead of routing it through async React state.
  // On mobile the last text is committed at blur (IME compositionend) at the
  // same moment the user taps Publish, and an async state update loses that
  // race, submitting an empty/stale body. A direct DOM write can't.
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0); // refresh toolbar active states on selection
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  // Keep the latest onChange so the editor's create/update callbacks (captured
  // once) always call the current prop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // The editor instance, held in a ref so the paste/drop handlers (created
  // inside useEditor, before `editor` below is assigned) can reach it.
  const editorRef = useRef<Editor | null>(null);
  // Caret position captured when the image button is pressed. The file dialog
  // blurs the editor, so by the time the upload finishes the selection has been
  // lost; without this the image would land at the top of the doc instead of
  // where the caret was.
  const pendingPosRef = useRef<number | undefined>(undefined);

  // Shared upload → insert, used by the toolbar button, paste, and drag-drop.
  // Uploads the image to Supabase then inserts a captioned figure block at the
  // given position (or the current selection).
  async function uploadImage(file: File, pos?: number) {
    const ed = editorRef.current;
    if (!ed) return;
    setUploading(true);
    setErr(null);

    // Downscale/compress in the browser so big photos stay under the upload
    // limit (and load faster) without going soft.
    const upload = await compressImage(file).catch(() => file);

    const fd = new FormData();
    fd.append("file", upload);
    fd.append("bucket", "blog-images");

    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.publicUrl) {
        setErr(
          res.status === 401
            ? "เซสชันหมดอายุ — กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ (ปุ่ม Logout ในเมนู) แล้วลองอีกครั้ง"
            : data.error || "Upload failed"
        );
      } else {
        const chain = ed.chain().focus();
        if (typeof pos === "number") chain.setTextSelection(pos);
        // Insert a captioned figure, then a paragraph to keep typing.
        chain
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

  // Upload up to 5 images and insert them as one gallery row. One image falls
  // back to a normal captioned figure. Reuses the same compress + upload path.
  // `pos` restores the caret captured when the button was pressed — the file
  // dialog blurs the editor, so without it the row lands at the top of a long
  // body instead of where the user was typing (and looks like it vanished).
  async function uploadGallery(fileList: FileList | File[], pos?: number) {
    const ed = editorRef.current;
    if (!ed) return;
    const files = Array.from(fileList).slice(0, 5);
    if (!files.length) return;

    setUploading(true);
    setErr(null);
    const urls: string[] = [];
    let sessionExpired = false;

    for (const file of files) {
      const upload = await compressImage(file).catch(() => file);
      const fd = new FormData();
      fd.append("file", upload);
      fd.append("bucket", "blog-images");
      try {
        const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.publicUrl) {
          urls.push(data.publicUrl);
        } else if (res.status === 401) {
          sessionExpired = true;
          break;
        }
      } catch {
        // skip this file, keep going with the rest
      }
    }
    setUploading(false);

    if (sessionExpired) {
      setErr(
        "เซสชันหมดอายุ — กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ (ปุ่ม Logout ในเมนู) แล้วลองอีกครั้ง"
      );
    }
    if (!urls.length) {
      if (!sessionExpired) setErr("Upload failed");
      return;
    }

    const chain = ed.chain().focus();
    if (typeof pos === "number") chain.setTextSelection(pos);
    if (urls.length === 1) {
      chain.insertContent([
        { type: "figure", attrs: { src: urls[0], alt: files[0].name } },
        { type: "paragraph" },
      ]);
    } else {
      chain.insertContent([
        { type: "gallery", attrs: { images: urls } },
        { type: "paragraph" },
      ]);
    }
    chain.run();
  }

  // Heal legacy "two paragraphs merged into one node via <br><br>" content so
  // each paragraph is an independent block (client-only; SSR passes it through).
  const initialHtml = useMemo(
    () => splitDoubleBreaks(inlineEmojiImages(defaultValue)) || "<p></p>",
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
      Gallery,
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
      editorRef.current = editor;
      const h = editor.getHTML();
      if (hiddenRef.current) hiddenRef.current.value = h;
      onChangeRef.current?.(h);
    },
    onUpdate: ({ editor }) => {
      const h = editor.getHTML();
      if (hiddenRef.current) hiddenRef.current.value = h;
      onChangeRef.current?.(h);
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    editorProps: {
      // Turn pasted emoji-images (👍 from Facebook etc.) back into text so they
      // render inline at normal size instead of full-width block pictures.
      transformPastedHTML,
      // Paste (Ctrl+V) or drag-drop an image file → upload it and insert, just
      // like the toolbar button. Covers screenshots and copy-image from the web,
      // which otherwise paste as nothing. Non-image pastes fall through.
      handlePaste: (_view, event) => {
        const img = imageFromDataTransfer(event.clipboardData);
        if (!img) return false;
        event.preventDefault();
        uploadImage(img);
        return true;
      },
      handleDrop: (view, event) => {
        const img = imageFromDataTransfer(event.dataTransfer);
        if (!img) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadImage(img, pos);
        return true;
      },
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

  // On mouseup the browser sometimes hands focus from the just-clicked editor
  // to the first toolbar control, so a plain click doesn't "stick" (you had to
  // hold the mouse) and typing went elsewhere. Re-assert editor focus after the
  // release — the click/drag selection is already set by then, so it's
  // preserved. Only runs when the press started inside the editor, so clicking
  // the toolbar is unaffected.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    let pressedInEditor = false;
    const onDown = () => {
      pressedInEditor = true;
    };
    const onUp = () => {
      if (!pressedInEditor) return;
      pressedInEditor = false;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const active = document.activeElement;
          if (active !== dom && !dom.contains(active)) editor.view.focus();
        })
      );
    };
    // When focus leaves the editor (e.g. tapping Publish on mobile), make sure
    // the hidden input holds the very latest HTML before the form is read.
    const onBlur = () => {
      const h = editor.getHTML();
      if (hiddenRef.current) hiddenRef.current.value = h;
      // Also push the final HTML into state-based forms (e.g. the collections
      // sub-session editor), so content typed right before clicking Save isn't
      // lost to an uncommitted async update.
      onChangeRef.current?.(h);
    };
    dom.addEventListener("mousedown", onDown, true);
    document.addEventListener("mouseup", onUp, true);
    dom.addEventListener("blur", onBlur, true);
    return () => {
      dom.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("mouseup", onUp, true);
      dom.removeEventListener("blur", onBlur, true);
    };
  }, [editor]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (file) await uploadImage(file, pendingPosRef.current);
    pendingPosRef.current = undefined;
  }

  async function onGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = ""; // allow picking the same files again later
    if (files && files.length) await uploadGallery(files, pendingPosRef.current);
    pendingPosRef.current = undefined;
  }

  return (
    <div>
      {name && (
        <input type="hidden" name={name} defaultValue={defaultValue} ref={hiddenRef} />
      )}
      <div className="overflow-hidden rounded-lg border border-line/10 bg-surface/[0.03]">
        <Toolbar
          editor={editor}
          uploading={uploading}
          onImage={() => {
            pendingPosRef.current = editorRef.current?.state.selection.from;
            fileRef.current?.click();
          }}
          onGallery={() => {
            pendingPosRef.current = editorRef.current?.state.selection.from;
            galleryRef.current?.click();
          }}
        />
        {/* Bounded, self-scrolling content area so the toolbar stays in view
            while writing a long body (no need to scroll the whole modal up). */}
        <div className="max-h-[55vh] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onGalleryFile}
        className="hidden"
      />
      {err && <p className="mt-1 font-mono text-[11px] text-red-400">⚠ {err}</p>}
      <p className="mt-1 font-mono text-[10px] text-muted">
        🔗 แนบลิงก์ · จัดวางซ้าย/กลาง/ขวา · 🖼 รูป+คำอธิบาย (กดปุ่ม หรือวาง/ลากรูปมาวางได้) · ▦ แถวรูป (หลายรูปในแถวเดียว สูงสุด 5) · ▶ ฝังวิดีโอ/โซเชียล · ▦ ตาราง (กดในตารางเพื่อเพิ่ม/ลบแถว-คอลัมน์ · ลากขอบเพื่อปรับกว้าง)
      </p>
    </div>
  );
}

const BLOCKS = [
  { v: "p", label: "ย่อหน้า" },
  { v: "h1", label: "H1" },
  { v: "h2", label: "H2" },
  { v: "h3", label: "H3" },
  { v: "h4", label: "H4" },
  { v: "h5", label: "H5" },
  { v: "h6", label: "H6" },
];

/**
 * Block-format picker. A custom button+menu, not a native <select> — a select
 * would grab focus from the editor when you click the body (so typing changed
 * the heading and single clicks wouldn't stick). `onMouseDown preventDefault`
 * keeps the editor's selection so the format applies to it.
 */
function FormatMenu({
  block,
  onSelect,
}: {
  block: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = BLOCKS.find((b) => b.v === block) ?? BLOCKS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Typing (or any key) closes the menu so it never sits over the text.
    const onKey = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="รูปแบบข้อความ"
        // Toggle on a real mouse press (preventDefault keeps the editor's
        // selection). Using mousedown — not click — also ignores the phantom
        // "click" the browser fires on this button when it steals focus from
        // the editor, which used to pop the menu open over the text.
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 rounded bg-surface/[0.06] px-2 py-1 font-mono text-xs text-ink outline-none hover:bg-surface/[0.1]"
      >
        {current.label}
        <span className="text-[7px] text-muted">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-md border border-line/15 bg-space-light py-1 shadow-lg shadow-black/40">
          {BLOCKS.map((b) => (
            <button
              key={b.v}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(b.v);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                b.v === block ? "bg-cyan/20 text-cyan" : "text-ink hover:bg-surface/[0.08]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  uploading,
  onImage,
  onGallery,
}: {
  editor: Editor | null;
  uploading: boolean;
  onImage: () => void;
  onGallery: () => void;
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
      "วางลิงก์วิดีโอ/โซเชียล/เว็บไซต์ หรือไฟล์วิดีโอ (.mp4):\n" +
        "YouTube, Vimeo, Facebook, Instagram, TikTok, X, Loom, Google Drive,\n" +
        "Dailymotion, Streamable, Canva, Spotify, SoundCloud … หรือลิงก์เว็บอื่นๆ",
      "https://"
    );
    if (raw === null) return;
    const parsed = parseEmbed(raw);
    if (!parsed) {
      window.alert(
        "ฝังไม่ได้ — กรุณาวางลิงก์ (URL) ที่ขึ้นต้นด้วย http:// หรือ https://\n" +
          "รองรับแพลตฟอร์มยอดนิยม, ไฟล์วิดีโอ .mp4/.webm และเว็บไซต์ทั่วไป\n" +
          "(บางเว็บอาจบล็อกการฝัง ทำให้แสดงเป็นพื้นที่ว่าง)"
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
        <FormatMenu block={block} onSelect={setBlock} />
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
        <Btn title="แถวรูป (แกลเลอรี) — เลือกได้หลายรูปพร้อมกัน สูงสุด 5 รูปเรียงในแถวเดียว" disabled={uploading} onClick={onGallery} label={uploading ? "⏳ …" : "▦ แถวรูป"} />
        <Btn title="ฝังวิดีโอ/โซเชียล/เว็บไซต์ (YouTube, Vimeo, Facebook, IG, TikTok, X, Loom, Google Drive, Canva, ไฟล์ .mp4 ฯลฯ)" onClick={insertEmbed} label="▶ ฝัง" />
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
