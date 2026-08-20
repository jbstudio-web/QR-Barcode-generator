import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import jsQR from "jsqr";
import type { QrSettings, ScanCheckResult } from "./types";
import { EC_CAPACITY } from "./creativity";
import { contrast, luminance, rgbaToLuminance } from "./color";

export function normalizeUrl(u: string): string {
  let s = u.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.replace(/\/+$/, "");
  return s;
}

/** Turn raw user input into QR payload data (auto-prepend https://). */
export function toQrData(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(v)) return `https://${v}`;
  return v;
}

export function isValidHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Decode an RGBA ImageData buffer with zxing (the decoder family phones use). */
function decodeWithZxing(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string | null {
  const reader = new MultiFormatReader();
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);
  // zxing expects luminance (1 byte/px), not RGBA.
  const source = new RGBLuminanceSource(rgbaToLuminance(data), width, height);
  try {
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(source)));
    return result.getText();
  } catch {
    try {
      const result = reader.decode(
        new BinaryBitmap(new HybridBinarizer(source.invert())),
      );
      return result.getText();
    } catch {
      return null;
    }
  }
}

/** Fallback decoder: jsQR. */
function decodeWithJsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string | null {
  for (const inversionAttempts of ["dontInvert", "attemptBoth"] as const) {
    const result = jsQR(data, width, height, { inversionAttempts });
    if (result && result.data) return result.data;
  }
  return null;
}

/** Sample a rendered QR at several resolutions and decode it. */
function decodeAtSizes(
  canvas: HTMLCanvasElement,
  expected: string,
  sizes: number[],
): ScanCheckResult {
  const fail: ScanCheckResult = {
    status: "fail",
    decoded: null,
    matches: null,
    score: 0,
  };
  try {
    for (const size of sizes) {
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;
      ctx.drawImage(canvas, 0, 0, size, size);
      const img = ctx.getImageData(0, 0, size, size);
      const decoded =
        decodeWithZxing(img.data, size, size) ??
        decodeWithJsQR(img.data, size, size);
      if (decoded) {
        return {
          status: "pass",
          decoded,
          matches: normalizeUrl(decoded) === normalizeUrl(expected),
          score: 100,
        };
      }
    }
    return fail;
  } catch {
    return fail;
  }
}

export async function checkReadability(
  canvas: HTMLCanvasElement,
  expected: string,
): Promise<ScanCheckResult> {
  return decodeAtSizes(canvas, expected, [360, 560]);
}

// Dev-only hook so smoke tests can drive decoders directly in the page.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).__qrjsqr = jsQR;
}

/**
 * Heuristic 0–100 confidence based on settings, used to nuance the gauge
 * even when the emulated decode succeeds.
 */
export function heuristicScore(s: QrSettings): number {
  let risk = 0;

  const inkContrast = contrast(s.dotColor, s.bgColor);
  if (inkContrast < 2) risk += 60;
  else if (inkContrast < 4.5) risk += 35;
  else if (inkContrast < 7) risk += 12;

  const accentL = luminance(s.accentColor);
  if (s.gradient !== "none") {
    if (accentL > 0.78) risk += 34;
    else if (accentL > 0.62) risk += 14;
    if (s.gradient === "radial") risk += 6;
  }

  if (s.dotStyle === "dots") risk += 8;
  if (s.dotStyle === "classy-rounded") risk += 6;
  if (s.dotStyle === "extra-rounded") risk += 4;

  if (s.logo) {
    const cap = EC_CAPACITY[s.errorCorrection];
    if (s.logoSize > cap) risk += 26;
    else if (s.logoSize > cap * 0.8) risk += 9;
  }

  return Math.max(0, Math.min(100, Math.round(100 - risk)));
}
