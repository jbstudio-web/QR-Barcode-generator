"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import QRCodeStyling from "qr-code-styling";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Link2,
  ScanLine,
  XCircle,
} from "lucide-react";
import { buildQrOptions } from "@/lib/qr-options";
import { checkReadability, heuristicScore } from "@/lib/readability";
import { loadImage } from "@/lib/color";
import { drawLogoOverlay } from "@/lib/logo-overlay";
import { EXPORT_SIZES } from "@/lib/creativity";
import type { QrSettings, ScanCheckResult } from "@/lib/types";
import Scanner from "./scanner";
import { AdSlot } from "./ad-slot";
import { Segmented } from "./controls";

const PREVIEW_SIZE = 512;

interface Props {
  settings: QrSettings;
  data: string;
  scanResult: ScanCheckResult;
  onScanCheck: (r: ScanCheckResult) => void;
  onExportSizeChange: (size: number) => void;
}

export function QrPreview({
  settings,
  data,
  scanResult,
  onScanCheck,
  onExportSizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "svg" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const settingsRef = useRef(settings);
  const dataRef = useRef(data);
  const onScanCheckRef = useRef(onScanCheck);
  const lastScoreRef = useRef(100);
  const mountedRef = useRef(false);
  const checkIdRef = useRef(0);
  const renderPromiseRef = useRef<Promise<void>>(Promise.resolve());
  const logoImgCacheRef = useRef(new Map<string, HTMLImageElement>());

  const getLogoImage = useCallback(async (src: string): Promise<HTMLImageElement | null> => {
    const cached = logoImgCacheRef.current.get(src);
    if (cached) return cached;
    try {
      const img = await loadImage(src);
      logoImgCacheRef.current.set(src, img);
      return img;
    } catch {
      return null;
    }
  }, []);

  /** Draw the logo on top of a rendered QR canvas (preview or export). */
  const applyLogoOverlay = useCallback(
    async (canvas: HTMLCanvasElement | null, instance: unknown): Promise<void> => {
      if (!canvas) return;
      const logo = settingsRef.current.logo;
      if (!logo) return;
      const moduleCount = (instance as { _qr?: { getModuleCount: () => number } })
        ?._qr
        ?.getModuleCount?.();
      if (!moduleCount) return;
      const img = await getLogoImage(logo);
      if (img) drawLogoOverlay(canvas, moduleCount, settingsRef.current, img);
    },
    [getLogoImage],
  );

  // Keep latest props available to async callbacks.
  useEffect(() => {
    settingsRef.current = settings;
    dataRef.current = data;
    onScanCheckRef.current = onScanCheck;
  });

  // Init the QR instance whenever the container becomes available. The
  // container only mounts once a URL is entered (empty state shows a
  // placeholder instead), so this must not be a one-time mount effect —
  // otherwise pasting a URL into an empty app never creates the QR.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data) return;
    const qr = new QRCodeStyling(buildQrOptions(settingsRef.current, PREVIEW_SIZE, data));
    qr.append(container);
    qrRef.current = qr;
    mountedRef.current = true;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__qrInstance = qr;
    }
    return () => {
      container.innerHTML = "";
      qrRef.current = null;
      mountedRef.current = false;
    };
  }, [data]);

  // Re-render on settings/data change (throttled to one per frame).
  useEffect(() => {
    const qr = qrRef.current;
    if (!qr) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        qr.update(buildQrOptions(settingsRef.current, PREVIEW_SIZE, dataRef.current));
        setQrError(null);
        // qr-code-styling's SVG→canvas pass races the embedded logo image, so
        // draw the logo deterministically on top once the canvas settles.
        const settle = (async () => {
          const instance = qrRef.current as unknown;
          try {
            await (instance as { _canvasDrawingPromise?: Promise<void> })
              ?._canvasDrawingPromise;
          } catch {
            /* drawing failed */
          }
          const canvas = containerRef.current?.querySelector("canvas") as
            | HTMLCanvasElement
            | null;
          await applyLogoOverlay(canvas, instance);
        })();
        renderPromiseRef.current = settle;
      } catch (e) {
        setQrError(
          e instanceof Error && /overflow/i.test(e.message)
            ? "This URL is too long for the selected error-correction level."
            : "Could not render the QR code.",
        );
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [settings, data, applyLogoOverlay]);

  const runCheck = useCallback(async (id: number) => {
    const canvas = containerRef.current?.querySelector("canvas") as
      | HTMLCanvasElement
      | null;
    if (!canvas) return;
    // Wait for the lib draw + logo overlay of the latest render.
    await renderPromiseRef.current;
    // Let the last paint land.
    await new Promise((r) => setTimeout(r, 50));
    const res = await checkReadability(canvas, dataRef.current);
    // Discard stale results from superseded settings.
    if (id !== checkIdRef.current) return;
    const heuristic = heuristicScore(settingsRef.current);
    lastScoreRef.current = res.status === "pass" ? heuristic : Math.min(35, heuristic);
    onScanCheckRef.current({
      ...res,
      score: lastScoreRef.current,
    });
  }, []);

  // Debounced emulated scan check on every change.
  useEffect(() => {
    if (!mountedRef.current || !data) {
      onScanCheckRef.current({ status: "idle", decoded: null, matches: null, score: 100 });
      return;
    }
    const id = ++checkIdRef.current;
    onScanCheckRef.current({
      status: "checking",
      decoded: null,
      matches: null,
      score: lastScoreRef.current,
    });
    const timer = setTimeout(() => {
      void runCheck(id);
    }, 240);
    return () => clearTimeout(timer);
  }, [settings, data, runCheck]);

  // ---- export helpers ----

  function fileName(ext: string): string {
    let host = "qr";
    try {
      host = new URL(dataRef.current).hostname.replace(/^www\./, "");
    } catch {
      /* keep default */
    }
    return `qr-${host}.${ext}`;
  }

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
      const qr = new QRCodeStyling(
        buildQrOptions(settingsRef.current, settingsRef.current.exportSize, dataRef.current),
      );
      const instance = qr as unknown as {
        _getElement: (ext: string) => Promise<HTMLCanvasElement>;
      };
      const canvas = await instance._getElement("png");
      await applyLogoOverlay(canvas, qr);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob) downloadBlob(blob, fileName("png"));
    } finally {
      setBusy(null);
    }
  }

  async function exportSvg() {
    setBusy("svg");
    try {
      const qr = new QRCodeStyling({
        ...buildQrOptions(settingsRef.current, settingsRef.current.exportSize, dataRef.current),
        type: "svg",
      });
      const blob = await qr.getRawData("svg");
      if (blob instanceof Blob) downloadBlob(blob, fileName("svg"));
    } finally {
      setBusy(null);
    }
  }

  async function copyPng() {
    setBusy("copy");
    try {
      const qr = new QRCodeStyling(
        buildQrOptions(settingsRef.current, settingsRef.current.exportSize, dataRef.current),
      );
      const instance = qr as unknown as {
        _getElement: (ext: string) => Promise<HTMLCanvasElement>;
      };
      const canvas = await instance._getElement("png");
      await applyLogoOverlay(canvas, qr);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob instanceof Blob) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } catch {
          await navigator.clipboard.writeText(dataRef.current);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } finally {
      setBusy(null);
    }
  }

  // ---- scanability badge ----

  const badge = (() => {
    switch (scanResult.status) {
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
      case "checking":
        return {
          label: "Checking…",
          cls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        };
      default:
        return null;
    }
  })();

  const scoreColor =
    scanResult.status === "fail"
      ? "#ef4444"
      : scanResult.score >= 70
        ? "#34d399"
        : scanResult.score >= 40
          ? "#fbbf24"
          : "#ef4444";

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm sm:p-7">
      {/* QR stage */}
      <div className="dot-grid relative mx-auto flex aspect-square w-full max-w-[460px] xl:max-w-[540px] 2xl:max-w-[620px] items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-950/70 p-5 sm:p-7">
        {data ? (
          <>
            <div ref={containerRef} className="qr-canvas relative h-full w-full" />
            <AnimatePresence>
              {badge && (
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
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Link2 className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="max-w-[240px] text-xs leading-relaxed text-zinc-500">
              Paste a URL to generate your QR. Then push the creativity slider
              and watch the scanability meter react.
            </p>
          </div>
        )}
        {qrError && (
          <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300 backdrop-blur">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {qrError}
          </div>
        )}
      </div>

      {/* Scanability meter */}
      <div className="mt-5 rounded-2xl border border-zinc-800/70 bg-zinc-950/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">
              Scanability
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={scanResult.status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] font-medium"
              style={{ color: scoreColor }}
            >
              {scanResult.status === "checking"
                ? "Verifying…"
                : scanResult.status === "fail"
                  ? "Emulated scan failed"
                  : scanResult.status === "pass"
                    ? `${scanResult.score}% confidence`
                    : "Waiting for a URL"}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full"
            style={{ background: scoreColor }}
            animate={{ width: `${scanResult.status === "idle" ? 0 : scanResult.score}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        </div>
        {scanResult.status === "fail" && (
          <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
            A simulated phone scan couldn&apos;t decode this design. Pull the
            creativity slider back, raise the error-correction level, or
            increase contrast between the modules and background.
          </p>
        )}
        {scanResult.status === "pass" && scanResult.decoded && (
          <p className="mt-2.5 truncate font-mono text-[11px] text-zinc-500">
            decoded → {scanResult.decoded}
          </p>
        )}
      </div>

      {/* Export row */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="hidden sm:inline">Export</span>
          <div className="w-36">
            <Segmented
              value={String(settings.exportSize) as "512" | "1024" | "2048"}
              onChange={(v) => onExportSizeChange(Number(v))}
              options={EXPORT_SIZES.map((s) => ({
                value: String(s) as "512" | "1024" | "2048",
                label: `${s / 1024 >= 1 ? `${s / 1024}K` : s}`,
                title: `${s}px`,
              }))}
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={!data || busy !== null}
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
            disabled={!data || busy !== null}
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
            disabled={!data || busy !== null}
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

      {/* Scanner toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setScanOpen((v) => !v)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs font-medium transition ${
            scanOpen
              ? "border-zinc-700 bg-zinc-800/60 text-zinc-200"
              : "border-zinc-700/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          <ScanLine className="h-3.5 w-3.5" />
          {scanOpen ? "Close scanner" : "Test it with your camera"}
        </button>
        <AnimatePresence>
          {scanOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <Scanner expectedUrl={data} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Below-preview ad */}
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        <AdSlot slot="banner" format="horizontal" />
      </div>
    </div>
  );
}
