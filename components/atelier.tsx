"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { QrCode, RotateCcw } from "lucide-react";
import QrStudio from "./qr-studio";
import { Segmented } from "./controls";

// bwip-js is browser-only and heavy — load the barcode studio lazily so the
// QR page (and SSR) never pulls it in.
const BarcodeStudio = dynamic(() => import("./barcode-studio"), { ssr: false });

export default function Atelier({ initialUrl = "" }: { initialUrl?: string }) {
  const [mode, setMode] = useState<"qr" | "barcode">("qr");
  const [resetToken, setResetToken] = useState(0);

  return (
    <div className="relative flex flex-1 flex-col">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[12%] h-[380px] w-[540px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute right-[-8%] top-1/3 h-[360px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-6 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight">QR Atelier</p>
            <p className="text-[11px] text-zinc-500">
              design lab for QR codes &amp; barcodes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-[11px] text-zinc-600 xl:block">
            create → brand → verify → export
          </p>
          <div className="w-44">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "qr", label: "QR" },
                { value: "barcode", label: "Barcode" },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => setResetToken((t) => t + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <div className={mode === "qr" ? "" : "hidden"}>
          <QrStudio initialUrl={initialUrl} resetToken={resetToken} />
        </div>
        <div className={mode === "barcode" ? "" : "hidden"}>
          <BarcodeStudio resetToken={resetToken} />
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-6 lg:px-8 2xl:px-12">
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-zinc-700">
          <span>QR Atelier — runs entirely in your browser · no accounts, no uploads</span>
          <span aria-hidden>·</span>
          <a href="/about" className="transition hover:text-zinc-500">About</a>
          <a href="/privacy" className="transition hover:text-zinc-500">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
