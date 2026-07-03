"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Figure } from "./figure-extension";

interface Props {
  /** Form field name — submits the resulting HTML. */
  name: string;
  defaultValue?: string;
}

/**
 * WYSIWYG body editor (TipTap). Paragraphs, H1–H6, bold/italic, lists, quote,
 * left/center/right alignment, links (wrap selected text), and images with an
 * optional caption — placed as blocks between paragraphs. Outputs clean HTML
 * into a hidden input so the saveBlog server action keeps reading `body`.
 */
export default function RichTextEditor({ name, defaultValue = "" }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [, setTick] = useState(0); // refresh toolbar active states on selection
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: defaultValue || "<p></p>",
    immediatelyRender: false, // required for Next.js SSR
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    onSelectionUpdate: () => setTick((n) => n + 1),
    editorProps: {
      attributes: {
        class:
          "prose-cyber max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
  });

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
      <input type="hidden" name={name} value={html} />
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
        เลือกข้อความแล้วกด 🔗 เพื่อแนบลิงก์ · จัดวางซ้าย/กลาง/ขวาได้ · กด 🖼 แทรกรูป แล้วพิมพ์คำอธิบายใต้รูป
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

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line/10 bg-surface/[0.03] p-2">
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
