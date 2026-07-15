import { Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * A row of 2–5 images laid out side by side (WordPress-style gallery),
 * serialised as
 * <div class="blog-gallery blog-gallery-{n}"><img><img>…</div>.
 * Atom node: the image list lives in the `images` attribute (an array of src
 * URLs); the <img> children are rendered from it and read back on parse.
 */
export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      images: {
        default: [] as string[],
        parseHTML: (el) =>
          Array.from((el as HTMLElement).querySelectorAll("img"))
            .map((i) => i.getAttribute("src"))
            .filter((s): s is string => !!s)
            .slice(0, 5),
        // Rendered as <img> children (below), not as an attribute string.
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.blog-gallery" }];
  },

  renderHTML({ node }) {
    const images: string[] = Array.isArray(node.attrs.images)
      ? (node.attrs.images as string[]).slice(0, 5)
      : [];
    const count = Math.min(Math.max(images.length, 1), 5);
    const imgs: DOMOutputSpec[] = images.map((src) => [
      "img",
      { src, alt: "", loading: "lazy" },
    ]);
    return [
      "div",
      {
        class: `blog-gallery blog-gallery-${count}`,
        "data-count": String(count),
      },
      ...imgs,
    ];
  },
});
