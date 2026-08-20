"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Camera,
  CheckCircle2,
  CircleX,
  Loader2,
  ScanLine,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { normalizeUrl } from "@/lib/readability";
import type { ScanOutcome } from "@/lib/types";

const REGION_ID = "qr-atelier-scanner-region";

export default function Scanner({ expectedUrl }: { expectedUrl: string }) {
  const [mode, setMode] = useState<"idle" | "camera" | "file">("idle");
  const [outcome, setOutcome] = useState<ScanOutcome>("scanning");
  const [decoded, setDecoded] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const expectedRef = useRef(expectedUrl);

  // Keep the expected URL fresh for async callbacks.
  useEffect(() => {
    expectedRef.current = expectedUrl;
  });

  async function cleanup() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      await s.stop();
    } catch {
      /* already stopped */
    }
    try {
      s.clear();
    } catch {
      /* nothing to clear */
    }
  }

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, []);

  useEffect(() => {
    if (outcome === "pass" || outcome === "mismatch") {
      navigator.vibrate?.(outcome === "pass" ? 120 : 60);
    }
  }, [outcome]);

  function handleDecoded(text: string) {
    const matches = normalizeUrl(text) === normalizeUrl(expectedRef.current);
    setDecoded(text);
    setOutcome(matches ? "pass" : "mismatch");
  }

  async function startCamera() {
    setBusy(true);
    setMessage(null);
    setDecoded(null);
    setOutcome("scanning");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await cleanup();
      const s = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = s;
      setMode("camera");
      await s.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (w: number, h: number) => {
            const size = Math.floor(Math.min(w, h) * 0.66);
            return { width: size, height: size };
          },
        },
        (text: string) => handleDecoded(text),
        () => {
          /* per-frame miss — ignore */
        },
      );
    } catch (e) {
      setMode("idle");
      setOutcome("error");
      const err = e as { name?: string };
      setMessage(
        err?.name === "NotAllowedError" ||
          err?.name === "SecurityError" ||
          err?.name === "NotFoundError"
          ? "Camera access was denied or no camera was found. Allow access and retry, or upload an image instead."
          : "Could not start the camera. Try uploading an image instead.",
      );
      await cleanup();
    } finally {
      setBusy(false);
    }
  }

  async function stopCamera() {
    setMode("idle");
    await cleanup();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    setDecoded(null);
    setOutcome("scanning");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await cleanup();
      const s = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = s;
      setMode("file");
      const text = await s.scanFile(file, true);
      handleDecoded(text);
    } catch {
      setOutcome("fail");
      setMessage("No QR code was found in that image.");
    } finally {
      setBusy(false);
      await cleanup();
    }
  }

  const statusUi: Record<ScanOutcome, { label: string; cls: string; icon: React.ReactNode }> = {
    scanning: {
      label: "Scanning…",
      cls: "border-zinc-700 bg-zinc-900/80 text-zinc-300",
      icon: <ScanLine className="h-4 w-4 pulse-soft" />,
    },
    pass: {
      label: "Scans to your URL",
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    mismatch: {
      label: "Different URL detected",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      icon: <TriangleAlert className="h-4 w-4" />,
    },
    fail: {
      label: "No QR found",
      cls: "border-red-500/40 bg-red-500/10 text-red-300",
      icon: <CircleX className="h-4 w-4" />,
    },
    error: {
      label: "Scanner error",
      cls: "border-red-500/40 bg-red-500/10 text-red-300",
      icon: <CircleX className="h-4 w-4" />,
    },
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-zinc-500" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Live scan test
          </h3>
        </div>
        {mode !== "idle" && (
          <button
            type="button"
            onClick={() => void stopCamera()}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition hover:bg-zinc-800"
          >
            <X className="h-3 w-3" /> Stop
          </button>
        )}
      </div>

      <div
        id={REGION_ID}
        className="relative min-h-[240px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80"
      >
        {mode === "idle" ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Camera className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="max-w-[260px] text-xs leading-relaxed text-zinc-500">
              Verify the QR actually scans. Point your camera at the preview, or
              upload a screenshot.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCamera()}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:opacity-90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Use camera
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" /> Upload image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onFileSelected(e)}
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            {mode === "camera" && <div className="scanline" aria-hidden />}
            <AnimatePresence mode="wait">
              {outcome !== "scanning" && decoded && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 backdrop-blur"
                >
                  <p className="text-[11px] font-medium text-zinc-400">Decoded</p>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-zinc-200">
                    {decoded}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${statusUi[outcome].cls}`}
        >
          {statusUi[outcome].icon}
          {statusUi[outcome].label}
        </div>
        {message && (
          <p className="min-w-0 flex-1 truncate text-right text-[11px] text-zinc-500">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
