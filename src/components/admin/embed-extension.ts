import { Node, mergeAttributes } from "@tiptap/core";

/**
 * A block embed (video / social), serialised as
 * <div class="blog-embed blog-embed-{provider}" data-provider data-url>
 *   <iframe src="…platform embed…"></iframe>
 * </div>.
 * Atom node (no editable content); the iframe is non-interactive in the editor
 * (CSS pointer-events:none) so the block stays selectable/deletable.
 */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      provider: { default: null },
      src: { default: null },
      url: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.blog-embed",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            provider: e.getAttribute("data-provider"),
            url: e.getAttribute("data-url"),
            src:
              (e.querySelector("iframe") || e.querySelector("video"))?.getAttribute(
                "src"
              ) || null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { provider, src, url } = node.attrs;
    const wrap = {
      class: `blog-embed blog-embed-${provider || "generic"}`,
      "data-provider": provider,
      "data-url": url,
    };
    // Direct video files play in a native <video> element; everything else is
    // an iframe pointing at a platform embed endpoint.
    if (provider === "video") {
      return [
        "div",
        wrap,
        [
          "video",
          mergeAttributes({
            src,
            controls: "true",
            playsinline: "true",
            preload: "metadata",
          }),
        ],
      ];
    }
    return [
      "div",
      wrap,
      [
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
      ],
    ];
  },
});
