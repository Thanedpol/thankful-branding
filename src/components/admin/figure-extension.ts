import { Node, mergeAttributes } from "@tiptap/core";

/**
 * A block image with an optional editable caption, serialised as
 * <figure class="blog-figure"><img><figcaption>…</figcaption></figure>.
 * The caption is real inline content (edited like any text); the image src/alt
 * are node attributes. Plain <img> from older posts is still handled by the
 * separate Image extension, so existing content keeps working.
 */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "inline*",
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        contentElement: "figcaption",
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector("img");
          if (!img) return false;
          return { src: img.getAttribute("src"), alt: img.getAttribute("alt") };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { class: "blog-figure" }),
      ["img", { src: node.attrs.src, alt: node.attrs.alt || "" }],
      ["figcaption", {}, 0],
    ];
  },
});
