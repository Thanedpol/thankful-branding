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
