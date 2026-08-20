"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  Loader2,
  ScanLine,
  Type,
  XCircle,
} from "lucide-react";
import {
  BARCODE_FORMATS,
  DEFAULT_BARCODE,
  barcodeSvg,
  checkBarcode,
  renderBarcode,
  type BarcodeSettings,
} from "@/lib/barcode";
import type { ScanCheckResult } from "@/lib/types";
import { ColorField, RangeField, Section, Toggle } from "./controls";

export default function BarcodeStudio({ resetToken = 0 }: { resetToken?: number }) {
  const [s, setS] = useState<BarcodeSettings>(DEFAULT_BARCODE);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanCheckResult>({
    status: "idle",
    decoded: null,
    matches: null,
    score: 100,
  });
  const [busy, setBusy] = useState<"png" | "svg" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIdRef = useRef(0);
  const firstRunRef = useRef(true);

  const set = <K extends keyof BarcodeSettings>(key: K, value: BarcodeSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  // Render + live decode check (debounced per keystroke).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const timer = setTimeout(() => {
      if (!s.text.trim()) {
        setError(null);
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScan({ status: "idle", decoded: null, matches: null, score: 100 });
        return;
      }
      try {
        renderBarcode(canvas, s);
        setError(null);
        const id = ++scanIdRef.current;
        const res = checkBarcode(canvas, s);
        if (id === scanIdRef.current) setScan(res);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message.replace(/^bwip-js:\s*/i, "").replace(/^bwipp\.\w+#\d+:\s*/i, "")
            : "Could not render the barcode.",
        );
        // Clear the canvas so a failed render doesn't leave a stale barcode.
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScan({ status: "fail", decoded: null, matches: null, score: 0 });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [s]);

  // Reset via the shared header button (skip the initial mount run so a
  // prefilled session isn't wiped).
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setS(DEFAULT_BARCODE);
    setError(null);
    setScan({ status: "idle", decoded: null, matches: null, score: 100 });
  }, [resetToken]);

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }

  async function exportPng() {
    setBusy("png");
    try {
      const canvas = document.createElement("canvas");
      renderBarcode(canvas, s);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob) downloadBlob(blob, `barcode-${s.format}.png`);
    } finally {
      setBusy(null);
    }
  }

  async function exportSvg() {
    setBusy("svg");
    try {
      const svg = barcodeSvg(s);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      downloadBlob(blob, `barcode-${s.format}.svg`);
    } catch {
      setError("Could not export SVG for this data.");
    } finally {
      setBusy(null);
    }
  }

  async function copyPng() {
    setBusy("copy");
    try {
      const canvas = document.createElement("canvas");
      renderBarcode(canvas, s);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob instanceof Blob) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } catch {
          await navigator.clipboard.writeText(s.text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } finally {
      setBusy(null);
    }
  }

  const activeFormat = BARCODE_FORMATS.find((f) => f.id === s.format);
  const hasText = s.text.trim().length > 0;

  const badge = (() => {
    switch (scan.status) {
      case "pass":
        return {
          label: "Scannable",
          cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case "fail":
        return {
          label: "Not scannable",
          cls: "border-red-500/40 bg-red-500/10 text-red-300",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      default:
        return null;
    }
  })();

  const scoreColor =
    scan.status === "fail"
      ? "#ef4444"
      : scan.score >= 70
        ? "#34d399"
        : scan.score >= 40
          ? "#fbbf24"
          : "#ef4444";

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ------- controls ------- */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1.5">
          <Section title="Content" hint="text → barcode">
            <div className="space-y-1.5">
              <input
                type="text"
                value={s.text}
                onChange={(e) => set("text", e.target.value)}
                placeholder={activeFormat?.placeholder ?? "text…"}
                spellCheck={false}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              />
              <label className="block">
                <span className="mb-1.5 block text-xs text-zinc-400">Format</span>
                <select
                  value={s.format}
                  onChange={(e) => set("format", e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/60"
                >
                  {BARCODE_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              {activeFormat && (
                <p className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-500">
                  <Barcode className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  {activeFormat.hint}
                </p>
              )}
            </div>
          </Section>

          <Section title="Style">
            <ColorField
              label="Bars"
              value={s.barColor}
              onChange={(v) => set("barColor", v)}
            />
            <ColorField
              label="Background"
              value={s.bgColor}
              onChange={(v) => set("bgColor", v)}
            />
            <RangeField
              label="Bar height"
              value={s.height}
              min={15}
              max={90}
              onChange={(v) => set("height", v)}
              format={(v) => `${v}mm`}
            />
            <RangeField
              label="Resolution"
              value={s.scale}
              min={1}
              max={4}
              step={0.5}
              onChange={(v) => set("scale", v)}
              format={(v) => `${v}×`}
            />
            <RangeField
              label="Quiet zone"
              value={s.quiet}
              min={0}
              max={16}
              onChange={(v) => set("quiet", v)}
              format={(v) => `${v}mm`}
            />
            <div className="border-t border-zinc-800/60 pt-3">
              <Toggle
                label="Show text below"
                description="Human-readable digits under the bars"
                checked={s.showText}
                onChange={(v) => set("showText", v)}
              />
              {s.showText && (
                <div className="pt-2">
                  <RangeField
                    label="Text size"
                    value={s.textSize}
                    min={8}
                    max={22}
                    onChange={(v) => set("textSize", v)}
                    format={(v) => `${v}pt`}
                  />
                </div>
              )}
            </div>
          </Section>

          <p className="px-1 pb-2 text-center text-[10px] leading-relaxed text-zinc-700">
            Standards-compliant 1D codes — bwip-js · zxing
          </p>
        </aside>

        {/* ------- preview ------- */}
        <section className="lg:sticky lg:top-4 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1.5">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm sm:p-7">
            {/* stage */}
            <div className="checker-light relative mx-auto flex aspect-[3/2] w-full max-w-[640px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-800/60 p-6">
              {hasText ? (
                <canvas
                  ref={canvasRef}
                  className="max-w-full rounded-md shadow-lg shadow-black/30"
                  style={{ height: "auto" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                    <Barcode className="h-6 w-6 text-zinc-600" />
                  </div>
                  <p className="max-w-[260px] text-xs leading-relaxed text-zinc-500">
                    Type text (or digits) to generate a barcode. Each format
                    has its own character rules.
                  </p>
                </div>
              )}
              <AnimatePresence>
                {badge && hasText && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.9 }}
                    className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur ${badge.cls}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </motion.div>
                )}
              </AnimatePresence>
              {error && (
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 backdrop-blur">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* scanability */}
            <div className="mt-5 rounded-2xl border border-zinc-800/70 bg-zinc-950/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-300">
                    Verify
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={scan.status}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] font-medium"
                    style={{ color: scoreColor }}
                  >
                    {scan.status === "fail"
                      ? "Emulated scan failed"
                      : scan.status === "pass"
                        ? "Decodes correctly"
                        : "Waiting for text"}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: scoreColor }}
                  animate={{ width: `${scan.status === "idle" ? 0 : scan.score}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                />
              </div>
              {scan.status === "fail" && (
                <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
                  An emulated phone scan couldn&apos;t read this code. Check the
                  characters against the format rules, or raise the resolution
                  / bar height.
                </p>
              )}
              {scan.status === "pass" && scan.decoded && (
                <p className="mt-2.5 truncate font-mono text-[11px] text-zinc-500">
                  decoded → {scan.decoded}
                  {scan.matches === false && " (differs from input)"}
                </p>
              )}
            </div>

            {/* export */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-zinc-500">Export</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasText || busy !== null}
                  onClick={() => void exportPng()}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3.5 py-2 text-xs font-medium text-white shadow transition hover:opacity-90 disabled:opacity-40"
                >
                  {busy === "png" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PNG
                </button>
                <button
                  type="button"
                  disabled={!hasText || busy !== null}
                  onClick={() => void exportSvg()}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {busy === "svg" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileCode2 className="h-3.5 w-3.5" />
                  )}
                  SVG
                </button>
                <button
                  type="button"
                  disabled={!hasText || busy !== null}
                  onClick={() => void copyPng()}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {busy === "copy" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
              <Type className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              Point your phone at the screen to double-check with a real
              scanner.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
