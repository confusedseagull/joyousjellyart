// Canvas helpers for the order PDF. @react-pdf/renderer only embeds PNG/JPEG
// and has no glyph fallback, so everything it can't draw natively (WebP
// photos, remote reference images, and any text outside the bundled Latin
// font — e.g. Chinese cake messages or emoji) is rasterised here first.

const PX_PER_PT = 4;

/** Longest side of a reference image on the printed page, in points. */
export const REF_BOX = 110;

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Direct cross-origin <img> loads can fail where a plain fetch succeeds (and
// vice versa), so try both before giving up on a photo.
async function loadImageAnyWay(src: string): Promise<HTMLImageElement> {
  const crossOrigin = /^https?:\/\//.test(src) && new URL(src, window.location.href).origin !== window.location.origin;
  try {
    return await loadImage(src, crossOrigin);
  } catch (firstError) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw firstError;
      const url = URL.createObjectURL(await res.blob());
      try {
        return await loadImage(url, false);
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch {
      throw firstError;
    }
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) {
  const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
}

export async function fetchAsDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch ${src}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Square-cropped PNG data URL, optionally masked to a circle or rounded square. */
export async function toCroppedPng(
  src: string,
  { size, shape }: { size: number; shape: "circle" | "rounded" }
): Promise<string> {
  const img = await loadImageAnyWay(src);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else {
    const r = size * 0.14;
    ctx.roundRect(0, 0, size, size, r);
  }
  ctx.clip();
  drawCover(ctx, img, size);
  return canvas.toDataURL("image/png");
}

export interface FittedImage {
  src: string;
  /** Size on the page, in PDF points. */
  width: number;
  height: number;
}

/** Whole image (nothing cropped) scaled so its longest side is maxSide points, with softly rounded corners. */
export async function toFittedPng(src: string, { maxSide }: { maxSide: number }): Promise<FittedImage> {
  const img = await loadImageAnyWay(src);
  const scale = maxSide / Math.max(img.naturalWidth, img.naturalHeight);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width * PX_PER_PT;
  canvas.height = height * PX_PER_PT;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6 * PX_PER_PT);
  ctx.clip();
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { src: canvas.toDataURL("image/png"), width, height };
}

// Anything outside basic Latin / Latin-1 / Latin Extended-A/B and common
// punctuation + currency isn't in the bundled Instrument Sans subset.
const NEEDS_FALLBACK = /[^\u0000-ɏ -⁯₠-⃏]/;

export function needsFallbackFont(text: string): boolean {
  return NEEDS_FALLBACK.test(text);
}

// Closing punctuation that must stay on the line of the character before it.
const NO_LINE_START = /^[。，、．！？；：）」』】》〕\u201D\u2019,.!?;:)]/;

const CJK_CHAR = /[⺀-꓏豈-﫿︰-﹏＀-￯]/;

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf) tokens.push(buf);
    buf = "";
  };
  for (const ch of Array.from(text)) {
    if (ch === "\n") {
      flush();
      tokens.push("\n");
    } else if (/\s/.test(ch)) {
      flush();
      tokens.push(" ");
    } else if (CJK_CHAR.test(ch) || NEEDS_FALLBACK.test(ch)) {
      flush();
      tokens.push(ch);
    } else {
      buf += ch;
    }
  }
  flush();
  return tokens;
}

export interface RasterText {
  src: string;
  width: number;
  height: number;
}

/**
 * Renders (possibly multi-line, wrapped) text to a transparent PNG using the
 * browser's own font fallback, so CJK and emoji draw correctly. Sizes are in
 * PDF points; the bitmap is oversampled for crisp printing.
 */
export function rasterizeText(
  text: string,
  { fontSize, weight, color, maxWidth }: { fontSize: number; weight: 400 | 600; color: string; maxWidth: number }
): RasterText {
  const family = `"Instrument Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  const lineHeight = fontSize * 1.3;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `${weight} ${fontSize * PX_PER_PT}px ${family}`;
  const widthOf = (s: string) => measure.measureText(s).width / PX_PER_PT;

  const lines: string[] = [];
  let line = "";
  for (const token of tokenize(text)) {
    if (token === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    if (token === " " && !line) continue;
    if (line && widthOf(line + token) > maxWidth && !NO_LINE_START.test(token)) {
      lines.push(line.replace(/\s+$/, ""));
      line = token === " " ? "" : token;
    } else {
      line += token;
    }
  }
  lines.push(line);

  const height = Math.max(1, lines.length) * lineHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(maxWidth * PX_PER_PT);
  canvas.height = Math.ceil(height * PX_PER_PT);
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${weight} ${fontSize * PX_PER_PT}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => {
    ctx.fillText(l, 0, (i + 0.5) * lineHeight * PX_PER_PT);
  });

  return { src: canvas.toDataURL("image/png"), width: maxWidth, height };
}
