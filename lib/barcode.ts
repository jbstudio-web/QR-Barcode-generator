import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import bwipjs from "bwip-js/browser";
import { rgbaToLuminance } from "./color";
import type { ScanCheckResult } from "./types";

export interface BarcodeFormatInfo {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  zxing: BarcodeFormat;
}

/** 1D symbologies supported by the barcode mode. */
export const BARCODE_FORMATS: BarcodeFormatInfo[] = [
  {
    id: "code128",
    label: "Code 128",
    hint: "Any text — most versatile",
    placeholder: "ATELIER-2026",
    zxing: BarcodeFormat.CODE_128,
  },
  {
    id: "ean13",
    label: "EAN-13",
    hint: "12 or 13 digits (retail)",
    placeholder: "400638133393",
    zxing: BarcodeFormat.EAN_13,
  },
  {
    id: "ean8",
    label: "EAN-8",
    hint: "7 or 8 digits",
    placeholder: "96385074",
    zxing: BarcodeFormat.EAN_8,
  },
  {
    id: "upca",
    label: "UPC-A",
    hint: "11 or 12 digits",
    placeholder: "036000291452",
    zxing: BarcodeFormat.UPC_A,
  },
  {
    id: "code39",
    label: "Code 39",
    hint: "A–Z, 0–9 and - . space $ / + %",
    placeholder: "QR-ATELIER",
    zxing: BarcodeFormat.CODE_39,
  },
  {
    id: "itf14",
    label: "ITF-14",
    hint: "13 or 14 digits (cases)",
    placeholder: "15400141288763",
    zxing: BarcodeFormat.ITF,
  },
  // Codabar and Code 93 are omitted on purpose: bwip-js's browser build
  // doesn't ship the codabar encoder, and zxing-js can't reliably decode
  // Code 93 — both would always show a false "Not scannable" verdict.
];

export interface BarcodeSettings {
  text: string;
  format: string;
  /** Bar height in mm. */
  height: number;
  /** Pixels per mm — controls rendered resolution. */
  scale: number;
  /** Quiet-zone padding in mm. */
  quiet: number;
  barColor: string;
  bgColor: string;
  showText: boolean;
  textSize: number;
}

export const DEFAULT_BARCODE: BarcodeSettings = {
  text: "",
  format: "code128",
  height: 40,
  scale: 2.5,
  quiet: 4,
  barColor: "#111827",
  bgColor: "#ffffff",
  showText: true,
  textSize: 13,
};

export function formatById(id: string): BarcodeFormatInfo | undefined {
  return BARCODE_FORMATS.find((f) => f.id === id);
}

/** Build bwip-js render options from the UI settings. */
export function buildBarcodeOptions(s: BarcodeSettings) {
  let text = s.text.trim();
  // Code 39 only encodes uppercase; normalize so typing stays friendly.
  if (s.format === "code39") text = text.toUpperCase();
  return {
    bcid: s.format,
    text,
    scale: s.scale,
    height: s.height,
    paddingwidth: s.quiet,
    paddingheight: s.quiet,
    includetext: s.showText,
    textsize: s.textSize,
    textxalign: "center" as const,
    textcolor: s.barColor,
    barcolor: s.barColor,
    backgroundcolor: s.bgColor,
  };
}

/** Render the barcode into a canvas. Throws on invalid data for the format. */
export function renderBarcode(
  canvas: HTMLCanvasElement,
  s: BarcodeSettings,
): void {
  bwipjs.toCanvas(canvas, buildBarcodeOptions(s));
}

/** Return the barcode as an SVG string. Throws on invalid data. */
export function barcodeSvg(s: BarcodeSettings): string {
  return bwipjs.toSVG(buildBarcodeOptions(s));
}

/** Decode a 1D barcode from a rendered canvas using zxing (phone-grade). */
export function checkBarcode(
  canvas: HTMLCanvasElement,
  s: BarcodeSettings,
): ScanCheckResult {
  const fail: ScanCheckResult = {
    status: "fail",
    decoded: null,
    matches: null,
    score: 0,
  };
  if (!canvas.width || !canvas.height || !s.text.trim()) return fail;
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fail;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = decodeBarcode(img.data, canvas.width, canvas.height, s);
    if (decoded) {
      return {
        status: "pass",
        decoded,
        matches: barcodeMatches(s.text, decoded, s.format),
        score: 100,
      };
    }
    return fail;
  } catch {
    return fail;
  }
}

function decodeBarcode(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  s: BarcodeSettings,
): string | null {
  const fmt = formatById(s.format);
  const reader = new MultiFormatReader();
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, fmt ? [fmt.zxing] : []);
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

/**
 * Compare what was decoded to what was entered. EAN/UPC/ITF decoders return
 * the check digit, so allow the input to be one digit short of the decode.
 */
function barcodeMatches(
  expected: string,
  decoded: string,
  format: string,
): boolean {
  const e = expected.trim().toUpperCase();
  const d = decoded.trim().toUpperCase();
  if (e === d) return true;
  if (["ean13", "ean8", "upca", "itf14"].includes(format) && /^\d+$/.test(e) && /^\d+$/.test(d)) {
    return (
      Math.abs(e.length - d.length) === 1 &&
      (d.startsWith(e) || e.startsWith(d))
    );
  }
  return false;
}
