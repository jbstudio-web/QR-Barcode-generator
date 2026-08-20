import type { BrandPalette } from "./types";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  );
}

/** WCAG relative luminance, 0–1 */
export function luminance(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG contrast ratio between two colors (1–21) */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isLight(hex: string, threshold = 0.6): boolean {
  return luminance(hex) > threshold;
}

export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, "#ffffff", amount);
}

/** HSL saturation, 0–1 */
export function saturation(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const max = Math.max(c.r, c.g, c.b) / 255;
  const min = Math.min(c.r, c.g, c.b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/** Accepts "#abc" or "#aabbcc" and returns normalized lowercase hex, or null */
export function parseHex(input: string): string | null {
  let v = input.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  return hexToRgb(v) ? v.toLowerCase() : null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/** Load an image and re-encode it as a PNG data URL (keeps canvas untainted). */
export async function imageToDataUrl(src: string): Promise<string | null> {
  try {
    const img = await loadImage(src);
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return c.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Extract dominant colors from an image by downscaling + color bucketing. */
export function extractPalette(img: HTMLImageElement, maxColors = 6): string[] {
  const w = 64;
  const h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return [];
  }
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 140) continue; // skip transparent pixels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }
  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n);
  return ranked
    .slice(0, maxColors)
    .map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n));
}

/**
 * Convert an RGBA image buffer to 1-byte-per-pixel luminance. zxing's
 * RGBLuminanceSource expects either a packed-ARGB Int32Array or a raw
 * luminance buffer — passing raw RGBA makes it misread every channel byte
 * as a separate pixel, which silently breaks decoding.
 */
export function rgbaToLuminance(data: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29 + 128) >> 8;
  }
  return out;
}

/**
 * Turn extracted colors (+ optional theme-color) into a scannable brand
 * palette: dark ink for modules, saturated accent for gradients, light
 * background.
 */
export function buildBrandPalette(
  colors: string[],
  themeColor?: string | null,
): BrandPalette {
  const fallbackInk = "#111827";
  const fallbackBg = "#ffffff";

  let ink = colors.find((c) => luminance(c) < 0.45) ?? fallbackInk;

  let bg = colors.find((c) => luminance(c) > 0.75) ?? fallbackBg;

  let accent: string | null = null;
  if (themeColor && hexToRgb(themeColor)) {
    const l = luminance(themeColor);
    if (l > 0.08 && l < 0.8) accent = themeColor;
  }
  if (!accent) {
    const mid = colors.filter((c) => {
      const l = luminance(c);
      return l > 0.08 && l < 0.85;
    });
    accent = [...mid].sort((a, b) => saturation(b) - saturation(a))[0] ?? ink;
  }

  // Guarantee the modules stay readable against the background.
  if (contrast(ink, bg) < 4.5) {
    if (luminance(ink) < 0.5) bg = lighten(bg, 0.3);
    else ink = darken(ink, 0.35);
  }

  // Gradients sweep ink → accent across the canvas, so the accent must stay
  // dark enough that the light end of the sweep still reads against bg.
  if (accent && luminance(accent) > 0.45) {
    let t = 0;
    let candidate = accent;
    while (luminance(candidate) > 0.45 && t < 1) {
      t += 0.15;
      candidate = mix(accent, ink, t);
    }
    accent = candidate;
  }

  return {
    ink,
    accent,
    bg,
    bg2: mix(bg, accent, 0.16),
    colors,
    fromThemeColor: !!themeColor && luminance(themeColor) > 0.08 && luminance(themeColor) < 0.8,
  };
}
