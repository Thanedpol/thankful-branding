"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  /** Form field name — submits the resulting HTML. */
  name: string;
  defaultValue?: string;
}

/**
 * WYSIWYG body editor (TipTap). Enter creates a new paragraph automatically,
 * with Bold / Italic / headings / lists / quote via the toolbar (and Ctrl+B /
 * Ctrl+I). Outputs clean HTML into a hidden input so the existing saveBlog
 * server action keeps reading `body` from FormData unchanged.
 */
export default function RichTextEditor({ name, defaultValue = "" }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [, setTick] = useState(0); // refresh toolbar active states on selection

  const editor = useEditor({
    extensions: [StarterKit],
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

  return (
    <div>
      <input type="hidden" name={name} value={html} />
      <div className="overflow-hidden rounded-lg border border-line/10 bg-surface/[0.03]">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted">
        กด Enter = ขึ้นย่อหน้าใหม่ · เลือกข้อความแล้วกดปุ่ม B / I (หรือ Ctrl+B / Ctrl+I)
      </p>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    label,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    label: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1 font-mono text-xs transition-colors ${
        active
          ? "bg-cyan/20 text-cyan"
          : "text-muted hover:bg-surface/[0.06] hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line/10 bg-surface/[0.03] p-2">
      <Btn title="ตัวหนา (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label={<b>B</b>} />
      <Btn title="ตัวเอียง (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label={<i>I</i>} />
      <span className="mx-1 h-4 w-px bg-line/15" />
      <Btn title="หัวข้อใหญ่" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" />
      <Btn title="หัวข้อย่อย" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" />
      <span className="mx-1 h-4 w-px bg-line/15" />
      <Btn title="รายการจุด" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="• List" />
      <Btn title="รายการเลข" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1. List" />
      <Btn title="ข้อความอ้างอิง" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝" />
    </div>
  );
}
