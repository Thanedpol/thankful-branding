/**
 * Turn a saved .html file into content the rich-text editor can accept.
 *
 * A page carries a lot the editor has no use for — <head>, scripts, styles,
 * inline event handlers — and often points at images that only exist on the
 * author's disk. This strips the former and reports the latter so the caller can
 * upload what it can and drop what it can't, instead of importing broken images.
 *
 * Only what the editor's schema understands survives the actual insert (TipTap
 * drops unknown tags), so this is about safety and image handling, not layout.
 */
export interface ImportedHtml {
  /** Cleaned body element — read `.innerHTML` after fixing up images. */
  container: HTMLElement;
  /** <img> tags whose data: URI must be uploaded to become a real URL. */
  dataImgs: HTMLImageElement[];
  /** <img> tags pointing at a local/relative path — unreachable once published. */
  relativeImgs: HTMLImageElement[];
}

/** Tags that are content even with no text, so their block must be kept. */
const MEDIA_SELECTOR =
  "img, iframe, video, audio, table, hr, figure, canvas, svg, embed, object, source";

/** Blocks that a designed page uses for spacing and that carry no meaning empty. */
const BLOCK_SELECTOR =
  "p, div, section, article, header, footer, aside, main, nav, " +
  "h1, h2, h3, h4, h5, h6, li, ul, ol, blockquote, span, font, center";

/** Tags that lay out other blocks — whitespace between their children is source
 *  indentation, not content. */
const BLOCK_TAGS = new Set(
  ("BODY DIV P H1 H2 H3 H4 H5 H6 UL OL LI TABLE THEAD TBODY TFOOT TR TD TH " +
    "SECTION ARTICLE HEADER FOOTER ASIDE MAIN NAV FIGURE FIGCAPTION BLOCKQUOTE " +
    "PRE HR FORM DL DT DD CENTER").split(" ")
);

/** Tags whose own text runs together, so whitespace inside them is meaningful. */
const TEXT_PARENT = new Set(
  ("P H1 H2 H3 H4 H5 H6 LI BLOCKQUOTE A SPAN B STRONG I EM U S CODE PRE TD TH " +
    "FIGCAPTION LABEL SMALL SUB SUP MARK DT DD FONT").split(" ")
);

/** Blank to a reader: whitespace, &nbsp; (\u00a0) or a zero-width space (\u200b). */
const isBlank = (s: string | null) => !s || !s.replace(/[\s\u00a0\u200b]/g, "");

/** A neighbour that can't be running text: a block element, or nothing at all. */
const blockish = (n: ChildNode | null) =>
  n === null || (n.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(n.nodeName));

/** The nearest sibling that isn't blank text — indentation between two nodes
 *  must not hide the fact that they are neighbours. */
function nearestSibling(node: ChildNode, dir: "previousSibling" | "nextSibling") {
  let n = node[dir];
  while (n && n.nodeType === Node.TEXT_NODE && isBlank(n.textContent)) n = n[dir];
  return n;
}

/**
 * Delete whitespace-only text nodes that are just source indentation (they sit
 * between block elements). Whitespace that separates words — `x <b>y</b>` — has
 * a non-block neighbour, so it is left alone.
 */
function stripLayoutWhitespace(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const doomed: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    if (!isBlank(text.textContent)) continue;
    // Skip past other blank runs: a source file indents with several of them in
    // a row, and each would otherwise "hide" the block on the far side.
    const prev = nearestSibling(text, "previousSibling");
    const next = nearestSibling(text, "nextSibling");
    if (blockish(prev) && blockish(next)) doomed.push(text);
  }
  doomed.forEach((t) => t.remove());
}

/**
 * Drop the spacing scaffolding of a designed page.
 *
 * Such a page stacks empty <div>s, &nbsp; paragraphs, <br><br> runs and indented
 * source whitespace to create vertical rhythm. The editor turns every one of
 * those into a real empty paragraph, so the imported article arrives with a huge
 * gap between each line. None of it carries meaning once the CSS is gone.
 *
 * Call this AFTER resolving images: a block holding only an image must survive
 * the prune, but a block whose only image was just dropped must not.
 *
 * Returns how many nodes were removed (for the import summary).
 */
export function pruneEmptyBlocks(root: HTMLElement): number {
  let removed = 0;

  // Each removal can expose another (an emptied parent, a now-adjacent <br>),
  // so sweep until the tree stops changing. Bounded — every pass only deletes.
  for (let pass = 0; pass < 20; pass++) {
    const before = removed;

    // 1. Source indentation between blocks.
    stripLayoutWhitespace(root);

    // 2. <br> used as vertical spacing: repeated, at the edge of its block, or
    //    sitting between two blocks. A <br> with content on both sides — a real
    //    line break inside a paragraph — is kept.
    root.querySelectorAll("br").forEach((br) => {
      if (!br.isConnected) return;
      const parent = br.parentElement;
      // Look past indentation, or `</p>\n  <br>\n  <div>` reads as a real break.
      const prev = nearestSibling(br, "previousSibling");
      const next = nearestSibling(br, "nextSibling");
      const betweenBlocks =
        !!parent &&
        !TEXT_PARENT.has(parent.nodeName) &&
        blockish(prev) &&
        blockish(next);
      const atEdge = prev === null || next === null;
      const repeated = next?.nodeName === "BR" || prev?.nodeName === "BR";
      if (betweenBlocks || atEdge || repeated) {
        br.remove();
        removed++;
      }
    });

    // 3. Blocks holding neither text nor media.
    root.querySelectorAll(BLOCK_SELECTOR).forEach((el) => {
      if (!el.isConnected) return;
      if (el.querySelector(MEDIA_SELECTOR)) return;
      if (!isBlank(el.textContent)) return;
      el.remove();
      removed++;
    });

    if (removed === before) break;
  }

  return removed;
}

/** True for a src the published page could actually load. */
function isWebUrl(src: string): boolean {
  return /^(https?:)?\/\//i.test(src);
}

export function sanitizeImportedHtml(raw: string): ImportedHtml {
  const doc = new DOMParser().parseFromString(raw, "text/html");
  const body = doc.body ?? doc.createElement("body");

  // Anything executable or purely presentational at the document level.
  body
    .querySelectorAll("script, style, link, meta, noscript, template, base, title")
    .forEach((el) => el.remove());

  // Inline handlers (onclick=…) and javascript: links.
  body.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
    const href = el.getAttribute("href");
    if (href && /^\s*javascript:/i.test(href)) el.removeAttribute("href");
  });

  const dataImgs: HTMLImageElement[] = [];
  const relativeImgs: HTMLImageElement[] = [];
  body.querySelectorAll("img").forEach((img) => {
    const src = (img.getAttribute("src") ?? "").trim();
    if (!src) {
      relativeImgs.push(img);
    } else if (src.startsWith("data:image/")) {
      dataImgs.push(img);
    } else if (!isWebUrl(src)) {
      // "photo.png", "./img/x.jpg", "C:\…", "file://…" — all dead once published.
      relativeImgs.push(img);
    }
  });

  return { container: body, dataImgs, relativeImgs };
}

/** Convert a data: URI <img> back into a File so it can be uploaded. */
export function dataUrlToFile(dataUrl: string, name: string): File | null {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  const [, mime, isB64, payload] = m;
  try {
    const bytes = isB64
      ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(payload));
    const ext = (mime.split("/")[1] ?? "png").replace(/[^a-z0-9]/gi, "") || "png";
    return new File([bytes], `${name}.${ext}`, { type: mime });
  } catch {
    return null;
  }
}
