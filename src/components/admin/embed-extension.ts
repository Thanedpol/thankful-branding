import { Node, mergeAttributes } from "@tiptap/core";

/** The embed's player element (iframe, or <video> for a direct file). */
function playerAttrs(el: HTMLElement) {
  const inner = el.classList.contains("blog-embed")
    ? el
    : (el.querySelector(".blog-embed") as HTMLElement | null) ?? el;
  return {
    provider: inner.getAttribute("data-provider"),
    url: inner.getAttribute("data-url"),
    src:
      (inner.querySelector("iframe") || inner.querySelector("video"))?.getAttribute(
        "src"
      ) || null,
  };
}

/** An element with no children — used so a legacy embed (which has no
 *  <figcaption>) parses with an empty caption instead of swallowing its iframe. */
function emptyEl() {
  return document.createElement("figcaption");
}

/**
 * A block embed (video / social) with an optional editable caption, serialised as
 * <figure class="blog-embed-figure">
 *   <div class="blog-embed blog-embed-{provider}" data-provider data-url>
 *     <iframe …>  |  <video …>
 *   </div>
 *   <figcaption>…</figcaption>
 * </figure>
 *
 * The caption is real inline content (edited like any text), matching how the
 * Figure (image) node works. Legacy embeds stored as a bare <div class="blog-embed">
 * still parse — they simply come in with an empty caption. The player stays
 * non-interactive in the editor (CSS pointer-events:none) so the block remains
 * selectable/deletable.
 */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  content: "inline*",
  draggable: true,
  selectable: true,
  isolating: true,

  addAttributes() {
    return {
      provider: { default: null },
      src: { default: null },
      url: { default: null },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Backspace in an EMPTY caption removes the whole embed. Clicking the
      // player selects the block (it's contenteditable=false) so Delete works
      // too, but this gives a keyboard-only way out — without it the caret can
      // sit in the caption of an isolating node with no obvious way to remove it.
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        if (!empty || $anchor.parent.type.name !== this.name) return false;
        if ($anchor.parent.content.size !== 0) return false; // caption has text
        return this.editor.commands.deleteNode(this.name);
      },
    };
  },

  parseHTML() {
    return [
      {
        // New shape: figure wrapper + caption. Higher priority than the generic
        // `figure` rule of the image Figure node.
        tag: "figure.blog-embed-figure",
        priority: 60,
        contentElement: (el) =>
          (el as HTMLElement).querySelector("figcaption") ?? emptyEl(),
        getAttrs: (el) => playerAttrs(el as HTMLElement),
      },
      {
        // Legacy shape: bare embed div, no caption.
        tag: "div.blog-embed",
        contentElement: emptyEl,
        getAttrs: (el) => playerAttrs(el as HTMLElement),
      },
    ];
  },

  renderHTML({ node }) {
    const { provider, src, url } = node.attrs;
    const wrap = {
      class: `blog-embed blog-embed-${provider || "generic"}`,
      "data-provider": provider,
      "data-url": url,
      // Marks the player as non-content so clicking it selects the whole block
      // (press Delete to remove it) instead of dropping the caret in the
      // caption — the deletion affordance this node had when it was an atom.
      // Inert on the published page.
      contenteditable: "false",
    };
    // Direct video files play in a native <video> element; everything else is
    // an iframe pointing at a platform embed endpoint.
    const player =
      provider === "video"
        ? [
            "video",
            mergeAttributes({
              src,
              controls: "true",
              playsinline: "true",
              preload: "metadata",
            }),
          ]
        : [
            "iframe",
            mergeAttributes({
              src,
              loading: "lazy",
              frameborder: "0",
              allow:
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen",
              allowfullscreen: "true",
              referrerpolicy: "strict-origin-when-cross-origin",
              title: `${provider || "media"} embed`,
            }),
          ];
    return [
      "figure",
      { class: "blog-embed-figure" },
      ["div", wrap, player],
      ["figcaption", {}, 0],
    ];
  },
});
